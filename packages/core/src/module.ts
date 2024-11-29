import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir
  } from '@nuxt/kit'
import defu from 'defu'
// ts bug: https://github.com/nuxt/module-builder/issues/141
import type {} from 'nuxt/schema'

type ModuleOptions = {
	serverUrl?: string;
}

declare module 'nuxt/schema' {
	interface RuntimeConfig {
		fhir: {
			serverUrl: string;
		}
	}
}

const meta = {
	name: '@nhealth/fhir',
	version: '0.1',
	configKey: 'fhir',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		serverUrl: 'http://localhost:8103'
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui');
			nuxt.options.css.push(resolve('./runtime/tailwind.css'));
		}

		// add all app related things here
		addPlugin(resolve('./runtime/app/plugins/medplum'));
		addImports([{
			name: 'useMedplum',
			as: 'useMedplum',
			from: resolve('./runtime/app/composables/useMedplum')
		},{
			name: 'useFhir',
			as: 'useFhir',
			from: resolve('./runtime/app/composables/useFhir')
		}]);
		addComponentsDir({
			path: resolve('./runtime/app/components'),
			prefix: 'Fhir',
			global: true
		});

		const runtimeConfig = nuxt.options.runtimeConfig || {};

		runtimeConfig.public.fhir = defu(runtimeConfig.public.fhir || {}, {
			serverUrl: options.serverUrl
		});
	}
});