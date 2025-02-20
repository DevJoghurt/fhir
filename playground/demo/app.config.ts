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
				label: 'Fhir Server',
				icon: 'i-heroicons-fire',
				children: [{
					label: 'Server',
					to: '/server',
					icon: 'i-heroicons-server'
				},{
					label: 'Resources',
					to: '/resources',
					icon: 'i-heroicons-circle-stack'
				}]
			},{
				label: 'Questionnaire',
				to: '/questionnaire',
				icon: 'i-heroicons-chat-bubble-bottom-center-text'
			}]
		}
	}
})