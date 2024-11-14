import { writeFile, readFile } from 'node:fs/promises'
import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	addServerHandler,
	addServerImportsDir,
	addComponentsDir,
	logger,
} from '@nuxt/kit'
import { join } from 'pathe'
import { defu } from 'defu'
import { randomUUID } from 'uncrypto'
import type { ScryptConfig } from '@adonisjs/hash/types'
import type { SessionConfig } from 'h3'

const meta = {
	name: '@nhealth/auth',
	version: '0.1',
	configKey: 'auth',
};

type IdentityProvider = 'keycloak' | 'medplum'

type KeycloakConfig = {
	clientId: string
	clientSecret: string
	serverUrl: string
	realm: string
	redirectURL: string
}

type MedplumConfig = {
	clientId: string
	clientSecret: string
	serverUrl: string
	redirectURL: string
	scope?: string
}

function isKeycloakConfig(config: KeycloakConfig | MedplumConfig): config is KeycloakConfig {
	return (config as KeycloakConfig).realm !== undefined;
}

function isMedplumConfig(config: KeycloakConfig | MedplumConfig): config is MedplumConfig {
	return (config as MedplumConfig).scope !== undefined;
}

/**
 * Module options
 * @property {Object} [hash] - Optional hashing configuration.
 * @property {IdentityProvider} [provider] - The identity provider to use.
 * @property {KeycloakConfig | MedplumConfig} [config] - Configuration for the identity provider.
 * @property {SessionConfig} session - Session configuration.
 */
export type ModuleOptions = {
	hash?: {
		/**
		 * scrypt options used for password hashing
		 */
		scrypt?: ScryptConfig
	}
	provider?: IdentityProvider;
	config?: KeycloakConfig | MedplumConfig;
	session: SessionConfig
}

declare module 'nuxt/schema' {
	interface RuntimeConfig {
		hash: {
			scrypt: ScryptConfig
		}
		oauth: {
			keycloak: KeycloakConfig
			medplum: MedplumConfig
		}
		session: SessionConfig
	}
}

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		hash: {
			scrypt: {},
		},
	},
	async setup(options, nuxt) {
		const resolver = createResolver(import.meta.url)

		nuxt.options.alias['#auth'] = resolver.resolve(
			'./runtime/types/index',
		)

		const composables = [
			{ name: 'useUserSession', from: resolver.resolve('./runtime/app/composables/session') },
		]

		// App
		addComponentsDir({ path: resolver.resolve('./runtime/app/components') })
		addImports(composables)
		addPlugin(resolver.resolve('./runtime/app/plugins/session.server'))
		addPlugin(resolver.resolve('./runtime/app/plugins/session.client'))

		// Server
		addServerImportsDir(resolver.resolve('./runtime/server/lib/oauth'))
		addServerImportsDir(resolver.resolve('./runtime/server/utils'))
		addServerHandler({
		  handler: resolver.resolve('./runtime/server/api/session.delete'),
		  route: '/api/_auth/session',
		  method: 'delete',
		})
		addServerHandler({
		  handler: resolver.resolve('./runtime/server/api/session.get'),
		  route: '/api/_auth/session',
		  method: 'get',
		})

		addServerHandler({
			handler: resolver.resolve('./runtime/server/route/medplum.get'),
			route: '/_oauth',
			method: 'get',
		})

		// Set node:crypto as unenv external
		nuxt.options.nitro.unenv ||= {}
		nuxt.options.nitro.unenv.external ||= []
		if (!nuxt.options.nitro.unenv.external.includes('node:crypto')) {
			nuxt.options.nitro.unenv.external.push('node:crypto')
		}

		// Runtime Config
		const runtimeConfig = nuxt.options.runtimeConfig
		const envSessionPassword = `${
			runtimeConfig.nitro?.envPrefix || 'FHIR_'
		}SESSION_PASSWORD`

		runtimeConfig.session = defu(runtimeConfig.session, {
			name: 'fhir-session',
			password: process.env[envSessionPassword] || '',
			cookie: {
			sameSite: 'lax',
			},
		}) as SessionConfig

		runtimeConfig.hash = defu(runtimeConfig.hash, {
			scrypt: options.hash?.scrypt,
		})

		// Generate the session password
		if (nuxt.options.dev && !runtimeConfig.session.password) {
			runtimeConfig.session.password = randomUUID().replace(/-/g, '')
			// Add it to .env
			const envPath = join(nuxt.options.rootDir, '.env')
			const envContent = await readFile(envPath, 'utf-8').catch(() => '')
			if (!envContent.includes(envSessionPassword)) {
			await writeFile(
				envPath,
				`${
				envContent ? envContent + '\n' : envContent
				}${envSessionPassword}=${runtimeConfig.session.password}`,
				'utf-8',
			)
			}
		}

		// OAuth settings
		runtimeConfig.oauth = defu(runtimeConfig.oauth, {})
		// Keycloak OAuth
		if (options?.config && options.provider === 'keycloak' && isKeycloakConfig(options.config)) {
			runtimeConfig.oauth.keycloak = defu(runtimeConfig.oauth.keycloak, {
				clientId: options.config?.clientId || '',
				clientSecret: options.config?.clientSecret || '',
				serverUrl: options.config?.serverUrl || '',
				realm: options.config?.realm || '',
				redirectURL: options.config?.redirectURL || '',
			})
		}
		// Medplum OAuth
		runtimeConfig.oauth.medplum = defu(runtimeConfig.oauth.medplum, {
			clientId: options.config?.clientId || '',
			clientSecret: options.config?.clientSecret || '',
			serverUrl: options.config?.serverUrl || '',
			redirectURL: options.config?.redirectURL || '',
		})

	}
});