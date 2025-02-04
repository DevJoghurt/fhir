export default defineNuxtConfig({
  extends: [
    "@nhealth/app"
  ],

  modules: [
    "@nhealth/questionaire"
  ],

  fhir: {

  },

  colorMode: {
    preference: 'light'
  },

  devtools: {
    enabled: true
  },

  compatibilityDate: "2024-11-13"
})