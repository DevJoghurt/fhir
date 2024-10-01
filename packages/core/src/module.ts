import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	hasNuxtModule,
	installModule
  } from '@nuxt/kit'
import { defu } from 'defu'

type ModuleOptions = {
	serverUrl: string;
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
			installModule('@nuxt/ui')
		}
		nuxt.options.css.push(resolve('./runtime/tailwind.css'))

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