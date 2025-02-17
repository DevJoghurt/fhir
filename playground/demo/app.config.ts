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
		main: {
			items: [{
				label: 'Home',
				to: '/',
				icon: 'i-heroicons-home'
			},{
				label: 'Resources',
				to: '/resources',
				icon: 'i-heroicons-circle-stack'
			}, {
				label: 'Questionnaire',
				to: '/questionnaire',
				icon: 'i-heroicons-chat-bubble-bottom-center-text'
			}]
		}
	}
})