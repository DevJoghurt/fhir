import { usePackageLoader, defineEventHandler } from '#imports'
import { z } from 'zod'

const SearchSchema = z.object({
    search: z.string(),
    limit: z.number().default(10)
})

export default defineEventHandler(async (event) => {
    const { searchPackage } = usePackageLoader();

    const body = await readValidatedBody(event, SearchSchema.safeParse)

    const { search = '', limit = 10 } = body.data || {};
    const result = await searchPackage(search, limit);

    return result;
})