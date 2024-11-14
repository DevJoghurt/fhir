import { setUserSession, defineOAuthMedplumEventHandler } from '#imports'

export default defineOAuthMedplumEventHandler({
	config: {},
	async onSuccess(event, { user, tokens }) {
	  console.log('Medplum OAuth success:', user)
	  await setUserSession(event, {
		user: {
			id: user.id,
		}
	  })
	  return sendRedirect(event, '/')
	},
	// Optional, will return a json error and 401 status code by default
	onError(event, error) {
	  console.error('Medplum OAuth error:', error)
	  return sendRedirect(event, '/')
	},
})