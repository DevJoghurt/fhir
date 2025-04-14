//import { runTask } from "#imports";
import type { Package } from "../../types";
import * as fastq from "fastq";
import type { queueAsPromised } from "fastq";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type TaskStatus = 'idle' | 'running' | 'completed' | 'failed';

type TaskState = {
	status: TaskStatus;
	message?: string;
}

type WorkerEvent = {
	payload: RunTaskPayload;
	context: {
		logMessage: (message: string) => void;
		setStatus: (status: TaskStatus) => void;
	}
}

const taskState = {
	status: 'idle',
	message: undefined
} as TaskState

type RunTaskPayload = {
	job: string;
	packages: Package[];
}

const eventListeners = [] as Array<(state: TaskState) => void>;


async function worker({payload, context}: WorkerEvent) {
	context.logMessage("Profiling has started");
	await wait(5000); // Simulate some delay
	if(payload?.packages && payload?.packages.length > 0){
	  for(const packageItem of payload.packages){
		  // if there is a compressed package and it is not mounted, compress files and mount it
		  if(packageItem.compressed && packageItem.mounted === false){
			  context.logMessage(`Compressing package ${packageItem.identifier}`);
			  // compress the package and mount it
			  //const tmpDir = await extractPackage(packageItem);
			  context.logMessage(`Package ${packageItem.identifier} compressed`);
		  }
		  await wait(5000);

	  }
	  await wait(5000);
	} else {
	  context.logMessage("No packages found");
	}
	// Simulate a long-running task
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('Task completed');
			resolve({ result: "Success" });
		}, 1000);
	});
}


const queue: queueAsPromised<WorkerEvent> = fastq.promise(worker, 1)

export const useProfilingTask = () => {

	const onTaskStateChange = (listener: (state: TaskState) => void) => {
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
		console.log('Task state updated:', taskState);
		eventListeners.forEach(listener => listener(taskState));
	}

	const setStatus = (status: TaskStatus) => {
		taskState.status = status;
		eventListeners.forEach(listener => listener(taskState));
	}

	const addTask = (payload: RunTaskPayload) => {
		taskState.status = 'running';
		taskState.message = 'Profiling started';
		eventListeners.forEach(listener => listener(taskState));
		queue.push({ payload, context: { logMessage, setStatus } })
			.then(() => {
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
		addTask,
		onTaskStateChange,
		taskState
	}
}