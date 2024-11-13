import { defineFhirProfiling } from '@nhealth/fhir-profiling'

export default defineFhirProfiling({
	paths: {
		profilingDir: 'input',
		parallelProcessing: {
			enabled: true,
			dir: 'fsh-generated'
		}
	},
	docs: {
		header: {
		}
	}
});