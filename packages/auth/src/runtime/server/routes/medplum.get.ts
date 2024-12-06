import { setUserSession, defineOAuthMedplumEventHandler } from '#imports'

export default defineOAuthMedplumEventHandler({
	config: {},
	async onSuccess(event, { user, tokens }) {
	  await setUserSession(event, {
		user: {
			id: user.sub,
			displayName: tokens?.profile?.display,
			reference: tokens?.profile?.reference
		},
		secure: {
			idToken: tokens.id_token
		},
		accessToken: tokens.access_token
	  }, {
		maxAge: tokens.expires_in
	  })
	  return sendRedirect(event, '/')
	},
	// Optional, will return a json error and 401 status code by default
	onError(event, error) {
	  console.error('Medplum OAuth error:', error)
	  return sendRedirect(event, '/')
	},
})