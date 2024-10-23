export default defineNuxtConfig({
  compatibilityDate: "2024-09-30",
  modules: [
    "@nhealth/fhir-profiling"
  ],
  future: {
		compatibilityVersion: 4,
	},
  colorMode: {
    preference: 'light'
  },
  devtools: {
    enabled: true
  },
  extends: [
  ],
  fhirProfiling: {
    outDir: '.nuxt/fhir-profiling',
  },
  i18n: {
    locales: [{
		  code: 'de',
		  file: './de.json'
		}]
  }
})