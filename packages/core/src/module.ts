import {
	defineNuxtModule,
	createResolver,
	addImports,
	addComponentsDir,
	addServerImports,
	addServerImportsDir
  } from '@nuxt/kit'
import defu from 'defu'
// ts bug: https://github.com/nuxt/module-builder/issues/141
import type {} from '@nuxt/schema'

type ServerType = 'medplum' | 'hapi'

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
		server: 'hapi',
		serverUrl: 'http://localhost:8080',
		basePath: '/fhir'
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		nuxt.options.alias['#fhir/types'] = resolve('./runtime/types/index');

		// add all app related things here
		addImports([{
			name: 'useFhir',
			as: 'useFhir',
			from: resolve('./runtime/app/composables/useFhir')
		},{
			name: 'useResource',
			as: 'useResource',
			from: resolve('./runtime/app/composables/useResource')
		}, {
			name: 'useStructureDefinition',
			as: 'useStructureDefinition',
			from: resolve('./runtime/app/composables/useStructureDefinition')
		}]);

		addServerImports([{
			name: 'useFhir',
			as: 'useFhir',
			from: resolve('./runtime/server/utils/useFhir')
		}]);
		addComponentsDir({
			path: resolve('./runtime/app/components'),
			prefix: 'Fhir',
			global: true
		});

		addServerImportsDir(resolve('./runtime/utils'))

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