import { useRuntimeConfig } from '#imports'

export default defineNitroPlugin(async (nitro) => {

	// local packages are referenced in the runtime config
	const { packages } = useRuntimeConfig().profiling

	const { addTask }  = useProfilingTask()

	addTask({
		job: 'init',
		packages: packages || []
	});

	console.log('Test')

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