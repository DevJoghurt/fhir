import { defineFhirProfiling } from '@nhealth/fhir-profiling'

export default defineFhirProfiling({
	sushi: {
		fhirVersion: ['4.0.1'],
		canonical: 'http://example.org/fhir/StructureDefinition/my-profile',
		description: 'My Profile',
	},
	docs: {
		header: {
		}
	}
});