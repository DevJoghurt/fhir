import {
	defineNuxtModule,
	createResolver,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir
  } from '@nuxt/kit'
import defu from 'defu'
// ts bug: https://github.com/nuxt/module-builder/issues/141
import type {} from 'nuxt/schema'

type ServerType = 'medplum'

type Medplum = {
	clientId: string;
	clientSecret: string;
}
export type ModuleOptions = {
	server: ServerType;
	serverUrl?: string;
	basePath?: string;
	medplum?: Medplum;
}

declare module '@nuxt/schema' {
	interface RuntimeConfig {
		fhir: {
			medplum?: Medplum;
		}
	}
	interface PublicRuntimeConfig {
		fhir: {
			server: ServerType;
			serverUrl: string;
			basePath: string;
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
		server: 'medplum',
		serverUrl: 'http://localhost:8103',
		basePath: '/fhir/R4'
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui');
			nuxt.options.css.push(resolve('./runtime/tailwind.css'));
		}

		// add all app related things here
		addImports([{
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
			server: options.server,
			serverUrl: options.serverUrl,
			basePath: options.basePath
		});

		runtimeConfig.fhir = runtimeConfig.fhir || {};
		runtimeConfig.fhir.medplum = defu(runtimeConfig.fhir?.medplum || {}, options?.medplum || {});
	}
});