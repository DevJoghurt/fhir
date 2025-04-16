//import { runTask } from "#imports";
import type { Package } from '#fhirtypes/profiling';
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { usePackageStore, usePackageUtils } from "#imports";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type PackageInstallerStatus = 'idle' | 'running' | 'completed' | 'failed';
type LogType = 'info' | 'warning' | 'error';

type PackageInstallerState = {
	status: PackageInstallerStatus;
	log?: {
		type: LogType;
		message: string;
	};
}

type WorkerEvent = {
	options: {},
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


async function worker({context}: WorkerEvent) {
	const { logMessage } = context

	logMessage('info',"Profiling started");
	const { extractPackage, resolvePackageMeta, analyzePackage } = usePackageUtils()
	const { getPackages, updatePackage } = usePackageStore()
	const packages = await getPackages(['identifier', 'compressed', 'mounted', 'meta', 'files'])
	logMessage('info', `Install packages: ${packages.map(pkg => pkg.identifier).join(', ')}`)
	if(packages && packages.length > 0){
	  for(const pkg of packages){
			// if there is a compressed package and it is not mounted, extract files and mount it
			if(pkg.compressed && !pkg.mounted){
				logMessage('info', `Extract package ${pkg.identifier}`);
				// extract the package and mount it
				let tmpDir = await extractPackage(pkg);
				logMessage('info', `Extracted package: ${pkg.identifier} to ${tmpDir}`)
				// add mount point to the package
				pkg.mounted = `profiling:${pkg.identifier}`
				const resp = await updatePackage(pkg.identifier, {
					mounted: `profiling:${pkg.identifier}`
				})
				if(resp.success) logMessage('info', `Updated package compressed: ${pkg.identifier}`)
					else logMessage('error', `Failed to update package compressed: ${pkg.identifier}`)
			}

			// get the storage for the mounted directory
			const storage = useStorage(pkg?.mounted || '')
			const files = await storage.getKeys()
			// TODO: check if the mounted directory is empty and reset db entry if it is

			// check if there is a package.json file in the mounted directory
			// if pkg meta is not set, try to load it from the package.json file
			if(pkg.mounted && !pkg.meta){
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
			if(pkg.mounted && pkg.meta && !pkg.files){
				const packageFiles = await analyzePackage(storage, files)
				if(packageFiles){
					// write files to the database
					pkg.files = packageFiles
					const resp = await updatePackage(pkg.identifier, {
						files: packageFiles
					})
					if(resp.success) logMessage('info', `Updated package files: ${pkg.identifier}`)
					else logMessage('error', `Failed to update package files: ${pkg.identifier}`)
				}
			}
			// load data into fhir server
			// check if package needs dependencies
			if(pkg.files && pkg.files.length > 0){
				const dependencies = pkg.meta?.dependencies || {}
				if(Object.keys(dependencies).length > 0){
					// check if a dependency is missing
					const missingDependencies = Object.keys(dependencies).filter(dep => !packages.find(p => p.meta?.name === dep))
					if(missingDependencies.length > 0){
						logMessage('warning', `Missing dependencies for package ${pkg.identifier}: ${missingDependencies.join(', ')}`)
						// cannot install package without dependencies -> TODO: add dependency
						continue;
					}
					// check if dependencies are
				}
				// if no or no missing dependencies, install the package
				logMessage('info', `Installing package ${pkg.identifier}`)
			} else {
				logMessage('warning', `No files found for package ${pkg.identifier}`)
			}
	  }
	} else {
	  logMessage('warning', "No packages found");
	}

	logMessage('info','Profiling completed');
	return true
}


const queue: queueAsPromised<WorkerEvent> = fastq.promise(worker, 1)

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
			console.info(message)
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

	const install = () => {
		taskState.status = 'running';
		eventListeners.forEach(listener => listener(taskState));
		queue.push({
			options: {},
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