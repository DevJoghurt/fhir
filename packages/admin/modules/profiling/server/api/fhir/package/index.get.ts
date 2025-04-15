import { defineEventHandler, usePackageStore } from '#imports'

export default defineEventHandler(async (event) => {
	const  { getPackages } = usePackageStore()
	const packages = await getPackages()
	return packages
})