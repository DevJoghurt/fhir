export default defineNuxtConfig({
  extends: [
    "@nhealth/app",
    "@nhealth/admin",
  ],

  modules: [
    '@nuxt/ui',
    "@nhealth/questionnaire"
  ],

  css: ['~/assets/css/main.css'],

  fhir: {

  },

  ui: {
    fonts: true
  },

  colorMode: {
    preference: 'light'
  },

  devtools: {
    enabled: true
  },

  compatibilityDate: "2024-11-13"
})