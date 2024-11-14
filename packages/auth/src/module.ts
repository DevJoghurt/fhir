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

type ModuleOptions = {
	hash?: {
		/**
		 * scrypt options used for password hashing
		 */
		scrypt?: ScryptConfig
	}
}

declare module 'nuxt/schema' {
	interface RuntimeConfig {
	  hash: {
		scrypt: ScryptConfig
	  }
	  /**
	   * Session configuration
	   */
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
		runtimeConfig.oauth.keycloak = defu(runtimeConfig.oauth.keycloak, {
			clientId: '',
			clientSecret: '',
			serverUrl: '',
			realm: '',
			redirectURL: '',
		})
		// Medplum OAuth
		runtimeConfig.oauth.medplum = defu(runtimeConfig.oauth.medplum, {
			clientId: '',
			clientSecret: '',
			serverUrl: '',
			redirectURL: '',
		})

	}
});