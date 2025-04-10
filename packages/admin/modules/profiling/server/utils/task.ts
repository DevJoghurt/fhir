
type TaskStatus = 'idle' | 'running' | 'completed' | 'failed';
type TaskState = {
	status: TaskStatus;
}

const taskState = {
	status: 'idle',
	eventListeners: [] as Array<(state: TaskState) => void>,
} as TaskState

export const useTask = () => {

}