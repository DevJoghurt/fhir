import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir,
	addServerImportsDir,
	addServerHandler
  } from '@nuxt/kit'
import defu from 'defu'
import { randomUUID } from 'node:crypto'
import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
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
			installModule('@nuxt/ui');
		}
		nuxt.options.css.push(resolve('./runtime/tailwind.css'));

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

		nuxt.options.alias['#fhir'] = resolve('./runtime/types.d.ts');

	}
});