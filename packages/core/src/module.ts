import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports
  } from '@nuxt/kit'
import { defu } from 'defu'

type ModuleOptions = {
	serverUrl: string;
}

const meta = {
	name: 'fhir-core',
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

		addPlugin(resolve('./runtime/plugins/medplum'));

		addImports({
			name: 'useMedplum',
			as: 'useMedplum',
			from: resolve('./runtime/composables/useMedplum')
		});

		nuxt.options.runtimeConfig.public.fhir = defu(nuxt.options.runtimeConfig.public.fhir || {}, {
			serverUrl: options.serverUrl
		});

	}
});