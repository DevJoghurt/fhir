export default defineNuxtConfig({
  compatibilityDate: "2024-09-30",
  modules: [
    "@nhealth/fhir-profiling/module"
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
  nitro: {
    prerender: {
      // Workaround for "Error: [404] Page not found: /manifest.json"
      failOnError: false,
    },
  }
})