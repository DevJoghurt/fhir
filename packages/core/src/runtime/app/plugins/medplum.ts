import { defineNuxtPlugin, useRuntimeConfig } from '#imports';
import { MedplumClient } from '@medplum/core';

export default defineNuxtPlugin(() => {

	const { serverUrl } = useRuntimeConfig().public.fhir;

	const medplum = new MedplumClient({
		baseUrl: serverUrl,
		onUnauthenticated() {
			console.log('Unauthenticated');
		},
	});

	return {
	  provide: {
		medplum: medplum
	  }
	}
})