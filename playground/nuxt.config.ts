export default defineNuxtConfig({
  compatibilityDate: "2024-09-30",
  future: {
		compatibilityVersion: 4,
	},
  devtools: {
    enabled: true
  },
  extends: [
    '@nhealth/app'
  ],
  i18n: {
    locales: [{
		  code: 'de',
		  file: './de.json'
		}]
  }
})