// @ts-ignore
export default defineNuxtConfig({
	modules: [
	  '@nhealth/fhir',
	  '@nuxtjs/i18n'
	],
	i18n: {
		lazy: true,
		langDir: 'locales',
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