import { defineAppConfig } from '#imports'

/**
 * Default app config
 */
export default defineAppConfig({
	navigation: {
		sidebar: {
			items: [{
				label: 'Home',
				to: '/',
				icon: 'i-heroicons-home'
			}, {
				label: 'DicomWeb',
				to: '/dicomweb',
				icon: 'i-heroicons-cog-8-tooth'
			}]
		}
	}
})