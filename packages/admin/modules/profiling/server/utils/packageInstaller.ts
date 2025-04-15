//import { runTask } from "#imports";
import type { Package, PofileMeta } from "../../types";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { usePackageStore, resolvePackageMeta } from "#imports";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type PackageInstallerStatus = 'idle' | 'running' | 'completed' | 'failed';

type PackageInstallerState = {
	status: PackageInstallerStatus;
	message?: string;
}

type WorkerEvent = {
	options: {},
	context: {
		logMessage: (message: string) => void;
		setStatus: (status: PackageInstallerStatus) => void;
	}
}

const taskState = {
	status: 'idle',
	message: undefined
} as PackageInstallerState


const eventListeners = [] as Array<(state: PackageInstallerState) => void>;


async function worker({context}: WorkerEvent) {
	const { logMessage } = context

	logMessage("Profiling has started");
	const { getPackages, updatePackage } = usePackageStore()
	const packages = await getPackages()
	console.log('Install packages:', packages.map(pkg => pkg.identifier).join(', '))
	logMessage("Profiling has started - packages loaded");
	if(packages && packages.length > 0){
	  for(const pkg of packages){
			// if there is a compressed package and it is not mounted, extract files and mount it
			if(pkg.compressed && !pkg.mounted){
				console.log('Extracting package:', pkg.identifier)
				logMessage(`Extract package ${pkg.identifier}`);
				// extract the package and mount it
				let tmpDir = await extractPackage(pkg);
				console.log('Extracted package:', pkg.identifier, 'to', tmpDir)
				// add mount point to the package
				pkg.mounted = `profiling:${pkg.identifier}`
				const resp = await updatePackage(pkg.identifier, {
					mounted: `profiling:${pkg.identifier}`
				})
				console.log('Updated package compressed:', pkg.identifier, 'with response', resp)
			}

			// get the storage for the mounted directory
			const storage = useStorage(pkg?.mounted || '')
			const files = await storage.getKeys()

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
					if(resp.success) console.info('Updated package meta:', pkg.identifier)
					else console.error('Failed to update package meta:', pkg.identifier, resp)
				}
			}

			// analyse all files in the mounted directory
			if(pkg.mounted && pkg.meta && !pkg.files){

			}



	  }
	} else {
	  logMessage("No packages found");
	}

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

	const logMessage = (message: string) => {
		taskState.message = message;
		eventListeners.forEach(listener => listener(taskState));
	}

	const setStatus = (status: PackageInstallerStatus) => {
		taskState.status = status;
		eventListeners.forEach(listener => listener(taskState));
	}

	const install = () => {
		taskState.status = 'running';
		taskState.message = 'Profiling started';
		eventListeners.forEach(listener => listener(taskState));
		queue.push({
			options: {},
			context: {
				logMessage,
				setStatus
			}
		}).then(() => {
				taskState.status = 'completed';
				taskState.message = 'Profiling completed';
				eventListeners.forEach(listener => listener(taskState));
			})
			.catch((error) => {
				taskState.status = 'failed';
				taskState.message = `Profiling failed: ${error.message}`;
				eventListeners.forEach(listener => listener(taskState));
		});
	}

	return {
		install,
		addEventListener,
		taskState
	}
}