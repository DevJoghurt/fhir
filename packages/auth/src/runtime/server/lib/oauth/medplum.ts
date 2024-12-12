import type { H3Event } from 'h3'
import { eventHandler, getQuery, sendRedirect, setCookie, getCookie, deleteCookie } from 'h3'
import { useRuntimeConfig, createError } from '#imports'
import { handleMissingConfiguration, handleAccessTokenErrorResponse, getOAuthRedirectURL, requestAccessToken } from '../utils'
import { defu } from 'defu'
import { withQuery } from 'ufo'
import type { OAuthConfig } from '#auth'
import crypto from 'node:crypto'

export interface OAuthMedplumConfig {
	/**
	 * Medplum OAuth Client ID
	 * @default process.env.FHIR_OAUTH_MEDPLUM_CLIENT_ID
	 */
	clientId?: string
	/**
	 * Medplum OAuth Client Secret
	 * @default process.env.FHIR_OAUTH_MEDPLUM_CLIENT_SECRET
	 */
	clientSecret?: string
	/**
	 * Medplum OAuth Server URL
	 * @example http://localhost:8103/oauth2/authorize
	 * @default process.env.FHIR_OAUTH_MEDPLUM_SERVER_URL
	 */
	serverUrl?: string
	/**
	 * Redirect URL to to allow overriding for situations like prod failing to determine public hostname
	 * @default process.env.FHIR_OAUTH_MEDPLUM_REDIRECT_URL or current URL
	 */
	redirectUrl?: string

	/**
	 * Medplum OAuth Scope
	 * @default []
	 * @see https://www.medplum.com/docs/latest/authorization_services/
	 * @example 'openid'
	 */
	scope?: string
}

async function generateCodeChallenge(codeVerifier: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
	return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  function generateRandomString(length: number) {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
	  result += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return result;
  }

export function defineOAuthMedplumEventHandler({
	config,
	onSuccess,
	onError,
  }: OAuthConfig<OAuthMedplumConfig>) {
	return eventHandler(async (event: H3Event) => {
	  config = defu(config, useRuntimeConfig(event).oauth?.medplum, {
	  }) as OAuthMedplumConfig

		const query = getQuery<{ code?: string, error?: string }>(event)

		if (query.error) {
			const error = createError({
			statusCode: 401,
			message: `Medplum login failed: ${query.error || 'Unknown error'}`,
			data: query,
			})
			if (!onError) throw error
			return onError(event, error)
		}

		if (
			!config.clientId
			|| !config.clientSecret
			|| !config.serverUrl
			|| !config.scope
		) {
			return handleMissingConfiguration(event, 'medplum', ['clientId', 'clientSecret', 'serverUrl', 'scope'], onError)
		}

		// OAuth URLs
		// These are the URLs for Medplum's hosted servers
		// Replace these settings with your values if self-hosting
		//const baseUrl = 'https://api.medplum.com/';
		const authorizeUrl = config.serverUrl + '/oauth2/authorize';
		const tokenUrl = config.serverUrl + '/oauth2/token';

		const redirectUrl = config.redirectUrl || getOAuthRedirectURL(event)

		// Step 1: Authorization Code and redirect to Medplum Fhir Server
		if (!query.code) {
			config.scope = config.scope || 'openid'

			const codeVerifier = generateRandomString(64);
			const codeChallengeMethod = 'S256';
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			setCookie(event, 'codeVerifier', codeVerifier, { httpOnly: true });


			// Redirect to Medplum Oauth page
			return sendRedirect(
				event,
				withQuery(authorizeUrl, {
					client_id: config.clientId,
					redirect_uri: redirectUrl,
					scope: config.scope,
					response_type: 'code',
					code_challenge_method: codeChallengeMethod,
					code_challenge: codeChallenge,
				}),
			)
		}

		// Step 2: Access Token
		const tokens = await requestAccessToken(tokenUrl, {
			body: {
			  grant_type: 'authorization_code',
			  client_id: config.clientId,
			  redirect_uri: redirectUrl,
			  code_verifier: getCookie(event, 'codeVerifier'),
			  code: query.code,
			} })

		if (tokens.error) {
			return handleAccessTokenErrorResponse(event, 'medplum', tokens, onError)
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const user: any = await $fetch(
			`${config.serverUrl}/oauth2/userinfo/`,
			{
				method: 'GET',
				credentials: 'include',
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
					Accept: 'application/json',
				},
			},
		)

		if (!user) {
			const error = createError({
				statusCode: 500,
				message: 'Could not get Medplum user',
				data: tokens,
			})
			if (!onError) throw error
			return onError(event, error)
		}

		deleteCookie(event, 'codeVerifier')
		// medplum sets a cookie that we need to delete to allow for re-authentication
		deleteCookie(event, `medplum-${config.clientId}`)

		return onSuccess(event, {
			user,
			tokens,
		})

	})
}