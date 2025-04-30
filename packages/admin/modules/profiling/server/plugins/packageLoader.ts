import { useRuntimeConfig, usePackageInstaller, usePackageStore, usePackageUtils } from '#imports'

export default defineNitroPlugin(async (nitro) => {

	const { mountPackageStorage } = usePackageUtils()

	// mount profiling storage
	mountPackageStorage()

	// local packages are referenced in the runtime config
	const { packages, downloadPackages } = useRuntimeConfig().profiling

	const { initDatabase, addDownloadPackage } = usePackageStore()

	await initDatabase(packages || [])

	for (const [name, version] of Object.entries(downloadPackages)) {
		await addDownloadPackage(name, version || 'latest');
	}

	const { install }  = usePackageInstaller()

	install();

})