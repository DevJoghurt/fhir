//import { runTask } from "#imports";
import type { Package, StoragePackage, ProfileType, PackageStatusProcess, DownloadPackage } from '#fhirtypes/profiling';
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { usePackageStore, usePackageUtils } from "#imports";
import type { StructureDefinition, NamingSystem } from '@medplum/fhirtypes'


type PackageInstallerStatus = 'idle' | 'running' | 'completed' | 'failed';
type LogType = 'info' | 'warning' | 'error';

type PackageInstallerState = {
	status: PackageInstallerStatus;
	log?: {
		type: LogType;
		message: string;
	};
}

type InstallerParams = {
	options?: {
		checkReinstallProfiles?: boolean;
		ignoredDependencies?: string[];
	},
	packages: Package[];
	context: {
		logMessage: (type: LogType, message: string) => void;
		setStatus: (status: PackageInstallerStatus) => void;
	}
}

const taskState = {
	status: 'idle',
	log: undefined
} as PackageInstallerState


const eventListeners = [] as Array<(state: PackageInstallerState) => void>;

const MAX_RECURSIVE_DEPENDENCIES = 50;
let INSTALLER_RECURSIVE_COUNT = 0;

async function installer({options, context, packages}: InstallerParams) {
	const { logMessage } = context
	const {
		checkReinstallProfiles = false,
		ignoredDependencies = [],
	} = options || {}
	const {
		extractPackage,
		resolvePackageMeta,
		analyzePackage,
		resolveStoragePath,
		loadFhirProfileIntoServer,
		checkPackageDependencies,
		downloadPackage,
		PACKAGES_BASE_NAME
	} = usePackageUtils()

	const {
		updatePackage,
		addDownloadPackage,
		setPackageProcess,
		setPackageStatus
	} = usePackageStore()

	const { resolvePackageVersion } = usePackageLoader()

	// check if the installer has to run recursively
	let RERUN_INSTALLER = false

	if(packages && packages.length > 0){
	  for(const pkg of packages){
			// set the status to running
			pkg.process = 'running' as PackageStatusProcess
			await setPackageProcess(pkg.identifier, 'running' as PackageStatusProcess)

			// implement downloading of packages from the server
			if(pkg.download && !pkg.status?.downloaded){
				logMessage('info', `Download package ${pkg.identifier}`)
				const resolvedPackageVersion = await resolvePackageVersion(pkg.download.name, pkg.download.version)
				if(resolvedPackageVersion.status === 'success'){
					// add the compressed package to the package
					logMessage('info', `Found package ${pkg.identifier} on server: ${resolvedPackageVersion.package?.name}#${resolvedPackageVersion.package?.version}`)
					// download package to storage
					const downloadPkg = {
						name: resolvedPackageVersion.package?.name,
						version: resolvedPackageVersion.package?.version,
					} as DownloadPackage
					const compressedPackage = await downloadPackage(downloadPkg)
					if(compressedPackage){
						logMessage('info', `Downloaded package ${pkg.identifier} to storage: ${compressedPackage.baseName}:${compressedPackage.path}`)
						// add the compressed package to the package
						pkg.compressedPackage = compressedPackage
						pkg.status = await setPackageStatus(pkg.identifier, {
							downloaded: true
						})
						const resp = await updatePackage(pkg.identifier, {
							compressedPackage
						})
						if(resp.success) logMessage('info', `Updated package compressed: ${pkg.identifier}`)
							else logMessage('error', `Failed to update package compressed: ${pkg.identifier}`)
					}
				} else {
					logMessage('info', `Failed to download package ${pkg.identifier}: ${JSON.stringify(resolvedPackageVersion.message)}`)
					// set the status to failed after the package is installed
					await setPackageProcess(pkg.identifier, 'idle')
					pkg.status = await setPackageStatus(pkg.identifier, {
						downloaded: false
					})
					continue;
				}
			}

			// if there is a compressed package and it is not mounted, extract files and mount it
			if(pkg.compressedPackage && !pkg.status?.extracted){
				logMessage('info', `Extract package ${pkg.identifier}`);
				// extract the package and mount it
				let tmpDir = await extractPackage(pkg);
				logMessage('info', `Extracted package: ${pkg.identifier} to ${tmpDir}`)
				// add mount point to the package
				pkg.storage = {
					baseName: PACKAGES_BASE_NAME,
					dir: pkg.identifier
				} as StoragePackage
				const resp = await updatePackage(pkg.identifier, {
					storage: pkg.storage
				})
				if(resp.success) {
					pkg.status = await setPackageStatus(pkg.identifier, {
						extracted: true
					})
					logMessage('info', `Updated package compressed: ${pkg.identifier}`)
				}
				else logMessage('error', `Failed to update package compressed: ${pkg.identifier}`)
			}

			// get the storage for the mounted directory
			const storage = useStorage(resolveStoragePath(pkg?.storage))
			const files = await storage.getKeys()
			// TODO: check if the mounted directory is empty and reset db entry if it is

			// check if there is a package.json file in the mounted directory
			// if pkg meta is not set, try to load it from the package.json file
			if(pkg.storage && !pkg.status?.loaded){
				const profileMeta = await resolvePackageMeta(storage, files)
				if(profileMeta){
					// write meta to the database
					pkg.meta = profileMeta
					const resp = await updatePackage(pkg.identifier, {
						meta: profileMeta
					})
					if(resp.success) {
						pkg.status = await setPackageStatus(pkg.identifier, {
							loaded: true
						})
						logMessage('info', `Updated package meta: ${pkg.identifier}`)
					}
					else logMessage('error', `Failed to update package meta: ${pkg.identifier}`)
				}
			}

			// analyse all files in the mounted directory
			if(pkg.storage && pkg.status?.loaded && !pkg.status?.analyzed){
				const packageFiles = await analyzePackage(storage, files)
				if(packageFiles){
					// write files to the database
					pkg.files = packageFiles
					const resp = await updatePackage(pkg.identifier, {
						files: packageFiles
					})
					if(resp.success) {
						pkg.status = await setPackageStatus(pkg.identifier, {
							analyzed: true
						})
						logMessage('info', `Updated package files: ${pkg.identifier}`)
					}
					else logMessage('error', `Failed to update package files: ${pkg.identifier}`)
				}
			}
			// load data into fhir server
			if(pkg.files && pkg.files.length > 0){

				// check the availability of dependencies in the package
				const checkedDependencies = checkPackageDependencies(pkg.meta?.dependencies, packages, {
					ignoreDependencies: ignoredDependencies,
				})
				const missingDependencies = checkedDependencies.filter(dep => ((dep.status === 'missing') || (dep.status === 'loaded')))
				if(missingDependencies.length > 0){
					logMessage('warning', `Some dependencies for package ${pkg.identifier}: ${missingDependencies.map(dep => `${dep.package}@${dep.version}`).join(', ')} are not installed`)
					// get the dependencies that are not loaded
					const missingDependenciesLoaded = missingDependencies.filter(dep => dep.status === 'missing')
					for(const dep of missingDependenciesLoaded){
						// add the missing dependency to the download
						const downloadPkg = {
							name: dep.package,
							version: dep.version,
						} as DownloadPackage
						const newPackage = await addDownloadPackage(downloadPkg.name, downloadPkg.version)
						if(newPackage){
							logMessage('info', `Added missing dependency ${dep.package}@${dep.version} to download`)
							packages.push(newPackage)
						} else {
							logMessage('error', `Failed to add missing dependency ${dep.package}@${dep.version} to download`)
						}
					}
					RERUN_INSTALLER = true
					// set the status to waiting after the package is installed
					await setPackageProcess(pkg.identifier, 'waiting')
					continue;
				}

				// if there are no dependencies or there are no missing dependencies, install the package
				logMessage('info', `Installing package ${pkg.identifier}`)
				const packageFiles = pkg.files.filter(file => file.status.type === 'loaded')
				if((packageFiles && packageFiles.length > 0) || checkReinstallProfiles){
					// load files with an order into FHIR server
					const orderProfiles = ['codeSystem', 'valueSet', 'extension', 'profile', 'searchParameter', 'capabilityStatement', 'example'] as ProfileType[]
					for(const op of orderProfiles){
						const files = pkg.files.filter(file => file.type === op)
						// load the package into the fhir server
						for(const file of files){
							// check if the file is already installed
							if(file.status.type === 'installed'){
								logMessage('info', `File ${file.name} already installed`)
								continue;
							}
							const resource = await storage.getItem(file.path) as StructureDefinition | NamingSystem
							let resp = await loadFhirProfileIntoServer(resource)
							if(resp.status === 'success'){
								logMessage('info', `Installed ${file.type} ${file.name} into server`)
								file.status = {
									type: 'installed'
								}
							}
							if(resp.status === 'error'){
								logMessage('error', `Failed to load ${file.type} ${file.name} into server: ${JSON.stringify(resp.data)}`)
								file.status = {
									type: 'failed',
									message: resp.data
								}
							}
						}
					}
					const resp = await updatePackage(pkg.identifier, {
						files: pkg.files
					})
					if(resp.success){
						pkg.status = await setPackageStatus(pkg.identifier, {
							installed: true
						})
						await setPackageProcess(pkg.identifier, 'idle' as PackageStatusProcess)
						logMessage('info', `Installed package into server: ${pkg.identifier}`)
					}
					else logMessage('error', `Failed to install package into server: ${pkg.identifier}`)
				} else {
					logMessage('info', `All files installed for ${pkg.identifier}`)
				}

			} else {
				logMessage('warning', `No files found for package ${pkg.identifier}`)
			}
			// set the status to idle after the package is installed
			await setPackageProcess(pkg.identifier, 'idle')
	  }
	} else {
	  logMessage('warning', "No packages found");
	}

	logMessage('info', `Rerun installer if needed for dependencies ${RERUN_INSTALLER}`)
	// check if there are any packages with dependencies that are not installed -> rerun the installer
	if(RERUN_INSTALLER){
		if(INSTALLER_RECURSIVE_COUNT >= MAX_RECURSIVE_DEPENDENCIES){
			logMessage('error', 'Max recursive dependencies reached for package')
			return true
		}
		logMessage('info', 'Reinstall dependencies for packages')
		INSTALLER_RECURSIVE_COUNT++
		return await installer({options, context, packages})
	}

	logMessage('info','Profiling completed');
	return true
}


const installerQueue: queueAsPromised<InstallerParams> = fastq.promise(installer, 1)

export const usePackageInstaller = () => {

	const addEventListener = (listener: (state: PackageInstallerState) => void) => {
		eventListeners.push(listener);
		return {
			close: () => {
				const index = eventListeners.indexOf(listener);
				if (index > -1) {
					eventListeners.splice(index, 1);
				}
			}
		}
	}

	const logMessage = (type: LogType, message: string) => {
		taskState.log = {
			type,
			message
		};
		// add console log for the message
		if(type === 'info'){
			console.log(message)
		} else if(type === 'warning'){
			console.warn(message)
		} else if(type === 'error'){
			console.error(message)
		}
		eventListeners.forEach(listener => listener(taskState));
	}

	const setStatus = (status: PackageInstallerStatus) => {
		taskState.status = status;
		eventListeners.forEach(listener => listener(taskState));
	}

	const install = async () => {
		taskState.status = 'running';
		eventListeners.forEach(listener => listener(taskState));

		logMessage('info',"Profiling started");
		// get current package store and check if there are any packages to install
		const { getPackages } = usePackageStore()

		const packages = await getPackages(['identifier', 'status', 'download', 'compressedPackage', 'storage', 'meta', 'files'])

		logMessage('info', `Install packages: ${packages.map(packagesToInstall => packagesToInstall.identifier).join(', ')}`)

		// reset the dependencies count
		INSTALLER_RECURSIVE_COUNT = 0

		installerQueue.push({
			options: {
				checkReinstallProfiles: false,
				ignoredDependencies: ['hl7.fhir.extensions.r5'],
			},
			packages,
			context: {
				logMessage,
				setStatus
			}
		}).then(() => {
				taskState.status = 'completed';
				eventListeners.forEach(listener => listener(taskState));
			})
			.catch((error) => {
				taskState.status = 'failed';
				eventListeners.forEach(listener => listener(taskState));
		});
	}

	return {
		install,
		addEventListener,
		taskState
	}
}