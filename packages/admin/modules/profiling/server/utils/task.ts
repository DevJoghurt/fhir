//import { runTask } from "#imports";

import { set } from "zod";
import type { FhirProfilePackageMeta } from "../../types";

type TaskStatus = 'idle' | 'running' | 'completed' | 'failed';
type TaskState = {
	status: TaskStatus;
	message?: string;
}

const eventListeners = [] as Array<(state: TaskState) => void>;

const taskState = {
	status: 'idle',
	message: undefined
} as TaskState

type RunTaskPayload = {
	job: string;
	packages: FhirProfilePackageMeta[];
}

export const useTask = () => {

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

	const run = (payload: RunTaskPayload) => {
		taskState.status = 'running';
		taskState.message = 'Profiling started';
		eventListeners.forEach(listener => listener(taskState));
		runTask("profiling", {
			payload,
			context: {
				logMessage,
				setStatus,
			}
		});
	}

	return {
		run,
		onTaskStateChange,
		setStatus,
		logMessage,
		taskState
	}
}