import { defineEventHandler, useFhirClient, readValidatedBody, setResponseStatus, normalizeBundleResponse } from '#imports';
import z from 'zod';

const bodySchema = z.object({
	package: z.string(),
	version: z.string(),
  })


export default defineEventHandler(async (event) => {
	const { executeBatch, createUUID } = useFhirClient();

	const validatedResult = await readValidatedBody(event, bodySchema.safeParse)
	if (!validatedResult.success) {
		setResponseStatus(event, 400)
		return {
			status: 400,
			error: validatedResult.error.flatten(),
		}
	}

	// Create a Task and Fhir resource ImplementationGuide
	// TODO: Create an extension for the ImplementationGuide to link to the Task
	const taskUUID = createUUID();

	const resp = await executeBatch({
		resourceType: 'Bundle',
		type: 'transaction',
		entry: [{
			fullUrl: createUUID(),
			resource: {
				resourceType: 'ImplementationGuide',
				packageId: validatedResult.data.package,
				version: validatedResult.data.version,
				name: validatedResult.data.package,
				status: 'unknown',
				fhirVersion: ['4.0.1'],
				url: `http://hl7.org/fhir/${validatedResult.data.package}/${validatedResult.data.version}`,
				extension: [{
					url: 'http://nhealth.org/fhir/StructureDefinition/ImplementationGuideTaskExtension',
					valueReference: {
						reference: 'Task/' + taskUUID
					}
				}]
			},
			request: {
				method: 'POST',
				url: 'ImplementationGuide'
			}
		},
		{
			fullUrl: taskUUID,
			resource: {
				resourceType: 'Task',
				status: 'draft',
				intent: 'filler-order'
			},
			request: {
				method: 'POST',
				url: 'Task'
			}
		}]
	})

	// check response status
	const createdObjects = {
		implementationGuide: null,
		task: null
	} as {
		implementationGuide: string | null,
		task: any | null
	}
	for(const entry of resp?.entry || []) {
		const response = normalizeBundleResponse(entry.response)
		if(response.status === 201) {
			if(response.location?.includes('ImplementationGuide')) {
				createdObjects.implementationGuide = response.location
			}
			if(response.location?.includes('Task')) {
				createdObjects.task = response.location
			}
		}
	}


	return resp;
})