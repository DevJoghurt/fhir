import { defineEventHandler, usePackageStore, getValidatedQuery } from '#imports';
import { z } from 'zod';

const ColumnsSchema = z.enum(['identifier', 'status', 'meta', 'files'])

const QuerySchema = z.object({
  columns: z.union([ColumnsSchema, ColumnsSchema.array()]).transform((data) => {
	return Array.isArray(data)
	  ? data
	  : [data]
  }).default(['identifier', 'status', 'meta']),
})

export default defineEventHandler(async (event) => {
	const { getPackageById } = usePackageStore();

	let id = await getRouterParam(event, 'id') || null
	if(!id) throw createError({ statusCode: 400, statusMessage: 'Missing package id' })

	// Extract and validate columns filter from query parameters
	const parsedQuery = await getValidatedQuery(event, query => QuerySchema.safeParse(query))

	// Fetch packages with the specified columns
	id = decodeURIComponent(id as string)
	const packages = await getPackageById(id, parsedQuery.data?.columns);
	return packages;
});