import { defineAppConfig } from '#imports'

/**
 * Default app config
 */
export default defineAppConfig({
	ui: {
		colors: {
		  primary: 'blue',
		  neutral: 'zinc'
		}
	},
	navigation: {
		sidebar: {
			items: [{
				label: 'Home',
				to: '/',
				icon: 'i-heroicons-home'
			}, {
				label: 'Questionnaire',
				to: '/questionnaire',
				icon: 'i-heroicons-cog-8-tooth'
			}]
		}
	}
})