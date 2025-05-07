import { usePackageLoader, defineEventHandler } from '#imports'
import z from 'zod'

const FindSchema = z.object({
    name: z.string()
})

export default defineEventHandler(async (event) => {
    const { findPackage } = usePackageLoader();

    const body = await readValidatedBody(event, FindSchema.safeParse)

    const { name = '' } = body.data || {};
    const result = await findPackage(name);
    return result?.package || null;
})