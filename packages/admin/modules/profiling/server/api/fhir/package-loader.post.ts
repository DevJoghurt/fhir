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


	return {
		status: 200,
		message: 'Package loaded',
		data: validatedResult.data,
	} as any
})