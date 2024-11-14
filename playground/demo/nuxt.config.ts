export default defineNuxtConfig({
  extends: [
    "@nhealth/app"
  ],

  modules: [
  ],

  runtimeConfig: {
    oauth: {
      medplum: {
        clientId: 'd666f38e-789c-4216-be03-6945490889bf',
        clientSecret: '467ee05b1d52925997f289d40bb2762f3351337cb325954815fbfc19909c38c6',
        redirectURL: 'http://localhost:3000/_oauth'
      }
    }
  },

  auth: {
    provider: 'medplum',
    config: {

    }
  },

  colorMode: {
    preference: 'light'
  },

  devtools: {
    enabled: true
  },

  compatibilityDate: "2024-11-13"
})