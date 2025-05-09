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

type ServerUrl = string | {
	server: string;
	browser: string;
}

export type ModuleOptions = {
	server: ServerType;
	serverUrl?: ServerUrl;
	basePath?: string;
	medplum?: Medplum;
}

declare module '@nuxt/schema' {
	interface RuntimeConfig {
		fhir: {
			serverUrl: ServerUrl;
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
			name: 'useFhirClient',
			as: 'useFhirClient',
			from: resolve('./runtime/app/composables/useFhirClient')
		},{
			name: 'useFhirCapatibilityStatement',
			as: 'useFhirCapatibilityStatement',
			from: resolve('./runtime/app/composables/useFhirCapatibilityStatement')
		}, {
			name: 'useFhirResource',
			as: 'useFhirResource',
			from: resolve('./runtime/app/composables/useFhirResource')
		}, {
			name: 'useFhirUtils',
			as: 'useFhirUtils',
			from: resolve('./runtime/app/composables/useFhirUtils')
		}, {
			name: 'operationOutcomeToString',
			as: 'operationOutcomeToString',
			from: resolve('./runtime/utils/outcomes')
		}]);

		addServerImports([{
			name: 'useFhirClient',
			as: 'useFhirClient',
			from: resolve('./runtime/server/utils/useFhirClient')
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
			serverUrl: typeof options.serverUrl === 'string' ? options.serverUrl : options.serverUrl?.browser || options.serverUrl?.server,
			basePath: options.basePath
		});

		runtimeConfig.fhir = defu(runtimeConfig.fhir || {}, {
			serverUrl: typeof options.serverUrl === 'string' ? options.serverUrl : options.serverUrl?.server || options.serverUrl?.browser,
			basePath: options.basePath
		});
		runtimeConfig.fhir.medplum = defu(runtimeConfig.fhir?.medplum || {}, options?.medplum || {});
	}
});