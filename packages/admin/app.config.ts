import { defineAppConfig } from '#imports'

/**
 * Default app config
 */
export default defineAppConfig({
  title: 'Fhir Admin',
  navigation: {
    main: {
      items: []
    },
    dropdown: false
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
  dropdown?: false | Menu
  main?: Menu
}

declare module '@nuxt/schema' {
  interface AppConfigInput {
    /** Project name */
    title?: string
    /** App navigation menus */
    navigation?: Navigation
  }
}