import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
	modules: [
		'@nhealth/fhir',
		'@nuxtjs/i18n'
	],
	i18n: {
		lazy: true,
		strategy: 'no_prefix',
		defaultLocale: 'en',
		bundle: {
			optimizeTranslationDirective: false,
		},
		experimental: {
		},
		locales: [{
			code: 'de',
			file: './de.json'
		  },{
			code: 'en',
			file: './en.json'
		}]
	},
	nitro: {
		experimental: {
			tasks: true
		}
	}
})