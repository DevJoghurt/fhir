type MiddlewareMeta = boolean | {
	/**
	 * Whether to allow only unauthenticated users to access this page.
	 * Authenticated users will be redirected to `/` or the route defined in `navigateAuthenticatedTo`
	 *
	 * @default true
	 */
	unauthenticatedOnly: boolean
	/**
	 * Where to redirect authenticated users if `unauthenticatedOnly` is set to true
	 *
	 * @default undefined
	 */
	navigateAuthenticatedTo?: string
	/**
	 * Where to redirect unauthenticated users if this page is protected
	 *
	 * @default undefined
	 */
	navigateUnauthenticatedTo?: string
}

declare module '#app' {
	interface PageMeta {
		auth?: MiddlewareMeta
	}
}

declare module 'vue-router' {
	interface RouteMeta {
		auth?: MiddlewareMeta
	}
}


export default defineNuxtRouteMiddleware((to) => {
	// Normalize options. If `undefined` was returned, we need to skip middleware
	const options = normalizeUserOptions(to.meta.auth)
	if (!options) {
		return
	}

	const { loggedIn } = useUserSession()

	// Guest Mode - only unauthenticated users are allowed
	const isGuestMode = options.unauthenticatedOnly


	if (isGuestMode && !loggedIn.value) {
		// Guest Mode - unauthenticated users can stay on the page
		return
	}
	else if (isGuestMode && loggedIn.value) {
		// Guest Mode - authenticated users should be redirected to another page
		return navigateTo(options.navigateAuthenticatedTo)
	}
	else if (loggedIn.value) {
		// Authenticated users don't need any further redirects
		return
	}

  	// Fall back to login page
  	return navigateTo('/login')
})

interface MiddlewareOptionsNormalized {
	unauthenticatedOnly: boolean
	navigateAuthenticatedTo: string
	navigateUnauthenticatedTo?: string
}

/**
 * @returns `undefined` is returned when passed options are `false`
 */
function normalizeUserOptions(userOptions: MiddlewareMeta | undefined): MiddlewareOptionsNormalized | undefined {
	// false - do not use middleware
	// true - use defaults
	if (typeof userOptions === 'boolean' || userOptions === undefined) {
		return userOptions !== false
		? {
			// Guest Mode off if `auth: true`
			unauthenticatedOnly: false,
			navigateAuthenticatedTo: '/',
			navigateUnauthenticatedTo: undefined
			}
		: undefined
	}

	// We check in runtime in case usage error was not caught by TS
	if (typeof userOptions === 'object') {
		// Guest Mode on to preserve compatibility. A warning is also issued to prevent unwanted behaviour
		if (userOptions.unauthenticatedOnly === undefined) {
			if (process.env.NODE_ENV !== 'production') {
				console.warn(
				'[@nhealth/app] `unauthenticatedOnly` was not provided to `definePageMeta` - defaulting to Guest Mode enabled. '
				)
			}
			userOptions.unauthenticatedOnly = true
		}

		return {
			unauthenticatedOnly: userOptions.unauthenticatedOnly,
			navigateAuthenticatedTo: userOptions.navigateAuthenticatedTo ?? '/',
			navigateUnauthenticatedTo: userOptions.navigateUnauthenticatedTo
		}
	}
}