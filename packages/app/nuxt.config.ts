import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
	modules: [
	  '@nhealth/fhir',
	  '@nhealth/auth',
	  '@nuxtjs/i18n'
	],
	i18n: {
		lazy: true,
		strategy: 'no_prefix',
		defaultLocale: 'en',
		experimental: {
			typedOptionsAndMessages: "all"
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