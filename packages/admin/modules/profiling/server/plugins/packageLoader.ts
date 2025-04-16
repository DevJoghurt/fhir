import { useRuntimeConfig, usePackageInstaller, usePackageStore, usePackageUtils } from '#imports'

export default defineNitroPlugin(async (nitro) => {

	const { mountPackageStorage } = usePackageUtils()

	// mount profiling storage
	mountPackageStorage()

	// local packages are referenced in the runtime config
	const { packages } = useRuntimeConfig().profiling

	const { initDatabase } = usePackageStore()

	await initDatabase(packages || [])

	const { install }  = usePackageInstaller()

	install();

})