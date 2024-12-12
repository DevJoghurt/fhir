export default defineNuxtConfig({
  extends: [
    "@nhealth/app"
  ],

  modules: [
  ],

  auth: {
    provider: 'medplum',
    config: {
      medplum: {
        clientId: process.env.MEDPLUM_CLIENT_ID,
        clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
        redirectUrl: 'http://localhost:3000/auth/medplum',
        serverUrl: 'http://localhost:4443'
      }
    }
  },

  fhir: {
    medplum: {
      clientId: process.env.MEDPLUM_CLIENT_ID,
      clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
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