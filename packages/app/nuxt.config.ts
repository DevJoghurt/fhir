import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
	modules: [
	  '@nhealth/fhir',
	  '@nuxtjs/i18n'
	],
	i18n: {
		lazy: true,
		strategy: 'no_prefix',
		defaultLocale: 'en',
		experimental: {
		},
		locales: [{
			code: 'de',
			file: './de.json'
		  },{
			code: 'en',
			file: './en.json'
		}]
	}
})