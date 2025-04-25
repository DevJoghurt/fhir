//import { runTask } from "#imports";
import type { Package, StoragePackage, ProfileType, PackageStatusProcess } from '#fhirtypes/profiling';
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { usePackageStore, usePackageUtils } from "#imports";
import type { StructureDefinition, NamingSystem } from '@medplum/fhirtypes'
import defu from 'defu';


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
	const { extractPackage, resolvePackageMeta, analyzePackage, resolveStoragePath, loadFhirProfileIntoServer, PACKAGES_BASE_NAME } = usePackageUtils()
	const { updatePackage } = usePackageStore()

	// check if the installer has to run recursively
	let RERUN_INSTALLER = false

	if(packages && packages.length > 0){
	  for(const pkg of packages){
			// set the status to running
			pkg.status = defu({
				process: 'running' as PackageStatusProcess,
			}, pkg?.status || {})
			await updatePackage(pkg.identifier, {
				status: pkg.status
			})
			// if there is a compressed package and it is not mounted, extract files and mount it
			if(pkg.compressedPackage && !pkg.storage){
				logMessage('info', `Extract package ${pkg.identifier}`);
				// extract the package and mount it
				let tmpDir = await extractPackage(pkg);
				logMessage('info', `Extracted package: ${pkg.identifier} to ${tmpDir}`)
				// add mount point to the package
				pkg.storage = {
					baseName: PACKAGES_BASE_NAME,
					dir: pkg.identifier
				} as StoragePackage
				pkg.status = defu({
					extracted: true,
				}, pkg?.status || {})
				const resp = await updatePackage(pkg.identifier, {
					storage: pkg.storage,
					status: pkg.status
				})
				if(resp.success) logMessage('info', `Updated package compressed: ${pkg.identifier}`)
					else logMessage('error', `Failed to update package compressed: ${pkg.identifier}`)
			}

			// get the storage for the mounted directory
			const storage = useStorage(resolveStoragePath(pkg?.storage))
			const files = await storage.getKeys()
			// TODO: check if the mounted directory is empty and reset db entry if it is

			// check if there is a package.json file in the mounted directory
			// if pkg meta is not set, try to load it from the package.json file
			if(pkg.storage && !pkg.meta){
				const profileMeta = await resolvePackageMeta(storage, files)
				if(profileMeta){
					// write meta to the database
					pkg.meta = profileMeta
					const resp = await updatePackage(pkg.identifier, {
						meta: profileMeta
					})
					if(resp.success) logMessage('info', `Updated package meta: ${pkg.identifier}`)
					else logMessage('error', `Failed to update package meta: ${pkg.identifier}`)
				}
			}

			// analyse all files in the mounted directory
			if(pkg.storage && pkg.meta && !pkg.files){
				const packageFiles = await analyzePackage(storage, files)
				if(packageFiles){
					// write files to the database
					pkg.files = packageFiles
					pkg.status = defu({
						loaded: true,
					}, pkg?.status || {})
					const resp = await updatePackage(pkg.identifier, {
						files: packageFiles,
						status: pkg.status
					})
					if(resp.success) logMessage('info', `Updated package files: ${pkg.identifier}`)
					else logMessage('error', `Failed to update package files: ${pkg.identifier}`)
				}
			}
			// load data into fhir server
			if(pkg.files && pkg.files.length > 0){

				// check if package needs dependencies first
				let dependencies = Object.keys(pkg.meta?.dependencies || {})
				// remove ignored dependencies from the list if available
				dependencies = dependencies.filter(dep => !ignoredDependencies.includes(dep))
				if(dependencies.length > 0){
					// check if a dependency is missing
					const missingDependencies = [] as string[]
					for(const dep of dependencies){
						const depPkg = packages.find(p => p.meta?.name === dep)
						if(depPkg && depPkg.status && depPkg.status.loaded !== true){
							missingDependencies.push(dep)
						}
					}
					if(missingDependencies.length > 0){
						logMessage('warning', `Missing LOADED dependencies for package ${pkg.identifier}: ${missingDependencies.join(', ')}`)
						// cannot install package without dependencies -> TODO: add dependency if download of packages is implemented
						RERUN_INSTALLER = true
						// set the status to waiting after the package is installed
						pkg.status = defu({
							process: 'waiting' as PackageStatusProcess,
						}, pkg?.status || {})
						await updatePackage(pkg.identifier, {
							status: pkg.status
						})
						continue;
					}
					// check if dependencies are installed
					const missingDependenciesInstalled = [] as string[]
					for(const dep of dependencies){
						const depPkg = packages.find(p => p.meta?.name === dep)
						if(depPkg && depPkg.status && depPkg.status.installed !== true){
							missingDependenciesInstalled.push(dep)
						}
					}
					if(missingDependenciesInstalled.length > 0){
						// continue if some dependencies are not installed
						logMessage('warning', `Missing INSTALLED dependencies for package ${pkg.identifier}: ${missingDependenciesInstalled.join(', ')}`)
						RERUN_INSTALLER = true
						// set the status to waiting after the package is installed
						pkg.status = defu({
							process: 'waiting' as PackageStatusProcess,
						}, pkg?.status || {})
						await updatePackage(pkg.identifier, {
							status: pkg.status
						})
						continue;
					}
				}

				// if there are no dependencies or there are no missing dependencies, install the package
				logMessage('info', `Installing package ${pkg.identifier}`)
				const packageFiles = pkg.files.filter(file => file.status.type === 'loaded')
				if((packageFiles && packageFiles.length > 0) || checkReinstallProfiles){
					// load files with an order into FHIR server
					const orderProfiles = ['codeSystem', 'valueSet', 'extension', 'profile', 'searchParameter', 'example'] as ProfileType[]
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
					pkg.status = defu({
						process: 'idle' as PackageStatusProcess,
						installed: true,
					}, pkg?.status || {})
					const resp = await updatePackage(pkg.identifier, {
						status: pkg.status,
						files: pkg.files
					})
					if(resp.success) logMessage('info', `Installed package into server: ${pkg.identifier}`)
						else logMessage('error', `Failed to install package into server: ${pkg.identifier}`)
				} else {
					logMessage('info', `All files installed for ${pkg.identifier}`)
				}

			} else {
				logMessage('warning', `No files found for package ${pkg.identifier}`)
			}
			// set the status to idle after the package is installed
			pkg.status = defu({
				process: 'idle' as PackageStatusProcess,
			}, pkg?.status || {})
			await updatePackage(pkg.identifier, {
				status: pkg.status
			})
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

		const packages = await getPackages(['identifier', 'status', 'compressedPackage', 'storage', 'meta', 'files'])

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