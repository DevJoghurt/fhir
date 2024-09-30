import {
	defineNuxtModule,
	createResolver,
	installModule,
	hasNuxtModule
  } from '@nuxt/kit'

type ModuleOptions = {}

const meta = {
	name: 'fhir-ui',
	version: '0.1',
	configKey: 'fui',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url)

		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui')
		}
		if(!hasNuxtModule('@nhealth/fhir-core')){
			installModule('@nhealth/fhir-core')
		}

		nuxt.options.css.push(resolve('./runtime/tailwind.css'))
	}
});