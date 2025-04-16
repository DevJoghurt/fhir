import { defineEventHandler, usePackageStore, getValidatedQuery } from '#imports';
import z from 'zod';

const ColumnsSchema = z.enum(['identifier', 'compressed', 'mounted', 'meta', 'files'])

const QuerySchema = z.object({
  columns: z.union([ColumnsSchema, ColumnsSchema.array()]).transform((data) => {
	return Array.isArray(data)
	  ? data
	  : [data]
  }).default(['identifier', 'compressed', 'mounted', 'meta']),
})

export default defineEventHandler(async (event) => {
	const { getPackageById } = usePackageStore();

	const id = await getRouterParam(event, 'id') || null
	if(!id) throw createError({ statusCode: 400, statusMessage: 'Missing package id' })

	// Extract and validate columns filter from query parameters
	const parsedQuery = await getValidatedQuery(event, query => QuerySchema.safeParse(query))

	// Fetch packages with the specified columns
	const packages = await getPackageById(id, parsedQuery.data?.columns);
	return packages;
});