import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
	future: {
		compatibilityVersion: 4,
	},
	modules: [
	  '@nhealth/fhir',
	  '@nuxtjs/i18n'
	],
	rootDir: resolve('./src'),
	i18n: {
		lazy: true,
		strategy: 'no_prefix',
		defaultLocale: 'en',
		locales: [{
		  code: 'de',
		  file: './de.json'
		},{
		  code: 'en',
		  file: './en.json'
		}]
	},
})