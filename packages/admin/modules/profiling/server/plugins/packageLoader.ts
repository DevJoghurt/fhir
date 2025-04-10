import { getFhirPackages } from '#imports'
import type { Resource } from '@medplum/fhirtypes'

export default defineNitroPlugin(async (nitro) => {

	// load the package meta hl7.fhir.r4.core
	const packages = getFhirPackages()

	console.log('Packages:', packages)


	runTask("profiling", {
		payload: {
			job: 'init'
		}
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