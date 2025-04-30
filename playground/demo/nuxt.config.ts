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

  profiling: {
    downloadPackages: {
      'hl7.fhir.r4.core': '4.0.1',
      'de.medizininformatikinitiative.kerndatensatz.person': '2025.0.0',
      'de.medizininformatikinitiative.kerndatensatz.studie': '2025.0.0',
      'de.medizininformatikinitiative.kerndatensatz.bildgebung': '2025.0.0',
    }
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