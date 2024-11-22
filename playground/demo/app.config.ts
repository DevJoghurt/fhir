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
				label: 'Test',
				to: '/test',
				icon: 'i-heroicons-cog-8-tooth'
			}]
		}
	}
})