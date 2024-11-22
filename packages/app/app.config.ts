import { defineAppConfig } from '#imports'

/**
 * Default app config
 */
export default defineAppConfig({
  title: 'Fhir Application',
  navigation: {
    sidebar: {
      items: []
    },
    dropdownProfile: {
      items: [
        {
          t: 'profile.settings',
          to: '/settings',
          icon: 'i-heroicons-cog-8-tooth'
        }
      ]
    },
    pageSettings: {
      items: []
    }
  }
})

export type MenuItem = {
  t?: string
  label?: string
  defaultOpen?: boolean
  to?: string
  icon?: string
  exact?: boolean,
  children?: MenuItem[]
}

export type Menu = {
  items: MenuItem[]
}

//TODO: make more extendable and
export type Navigation = {
  dropdownProfile?: Menu
  pageSettings?: Menu
  sidebar?: Menu
}

declare module '@nuxt/schema' {
  interface AppConfigInput {
    /** Project name */
    title?: string
    /** App navigation menus */
    navigation?: Navigation
  }
}