import type { H3Event } from 'h3'
import { eventHandler, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig, createError } from '#imports'
import { defu } from 'defu'
import type { OAuthConfig } from '#auth'

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
	redirectURL?: string
}

export function defineOAuthMedplumEventHandler({
	config,
	onSuccess,
	onError,
  }: OAuthConfig<OAuthMedplumConfig>) {
	return eventHandler(async (event: H3Event) => {
	  config = defu(config, useRuntimeConfig(event).oauth?.medplum, {
		authorizationParams: {},
	  }) as OAuthMedplumConfig



	})
}