import { browser } from "node:process";

export default defineNuxtConfig({
  extends: [
    "@nhealth/app",
    "@nhealth/admin",
  ],

  modules: [
    '@nuxt/ui',
    "@nhealth/questionnaire"
  ],

  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 500, // Poll files every 100ms
      },
    }
  },

  css: ['~/assets/css/main.css'],

  fhir: {
    serverUrl: {
      server: process.env.APP_FHIR_SERVER_URL || 'http://localhost:8080',
      browser: process.env.APP_FHIR_BROWSER_URL || 'http://localhost:8080',
    },
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

  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: "2024-11-13"
})