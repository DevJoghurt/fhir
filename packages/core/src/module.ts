import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir
  } from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

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

		addComponentsDir({
			path: resolve('./runtime/components'),
			prefix: 'Fhir',
			global: true
		});

		nuxt.options.runtimeConfig.public.fhir = defu(nuxt.options.runtimeConfig.public.fhir || {}, {
			serverUrl: options.serverUrl
		});

		nuxt.options.alias['#fhir'] = resolve('./runtime/types.d.ts');

	}
});