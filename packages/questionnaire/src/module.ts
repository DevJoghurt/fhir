import {
	defineNuxtModule,
	createResolver,
	addComponentsDir
  } from '@nuxt/kit'
import defu from 'defu'
// ts bug: https://github.com/nuxt/module-builder/issues/141
import type {} from 'nuxt/schema'


export type ModuleOptions = {

}

declare module '@nuxt/schema' {
	interface PublicRuntimeConfig {

	}
}

const meta = {
	name: '@nhealth/questionnaire',
	version: '0.0.20',
	configKey: 'questionnaire',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		addComponentsDir({
			path: resolve('./runtime/app/components'),
			prefix: 'Fhir',
			global: true,
			watch: true
		});
	},
})