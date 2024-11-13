export default defineNuxtConfig({
  extends: [
    "@nhealth/app"
  ],
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
  }
})