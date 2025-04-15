import { useRuntimeConfig, usePackageInstaller, usePackageStore, mountProfiling } from '#imports'

export default defineNitroPlugin(async (nitro) => {

	// mount profiling storage
	mountProfiling()

	// local packages are referenced in the runtime config
	const { packages } = useRuntimeConfig().profiling

	const { initDatabase } = usePackageStore()

	await initDatabase(packages || [])

	const { install }  = usePackageInstaller()

	install();

	// load Value Sets, Code Systems, Extensions and Profiles into the server
	/*
	for (const profile of packageMeta.files) {
		const resource = await useStorage('assets:nhealth.r4.admin').getItem<Resource>(profile.path)
		if(!resource){
			throw new Error(`Failed to load resource ${profile.path}`)
		}else{
			await loadFhirProfileIntoServer(resource)
			console.log(`Loaded ${profile.path}`);
		}
	}
		*/
})