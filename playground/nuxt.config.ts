export default defineNuxtConfig({
  compatibilityDate: "2024-09-30",
  modules: [
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
    "@nhealth/app"
  ],
  nitro: {
    prerender: {
      // Workaround for "Error: [404] Page not found: /manifest.json"
      failOnError: false,
    },
  }
})