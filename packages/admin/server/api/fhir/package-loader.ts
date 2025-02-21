import { defineEventHandler, useFhir } from '#imports';

export default defineEventHandler((event) => {
	const { createResource  } = useFhir();

	createResource({
		resourceType: 'Task',
		status: 'draft',
		intent: 'filler-order'
	})
})