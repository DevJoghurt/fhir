import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
	modules: [
		'nuxt-queue',
		'@nhealth/fhir',
		'@nuxtjs/i18n'
	],
	queue: {
		ui: true,
		redis: {
			host: 'localhost',
			port: 6379
		}
	},
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