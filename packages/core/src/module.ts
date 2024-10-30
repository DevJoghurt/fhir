import {
	defineNuxtModule,
	createResolver,
	addPlugin,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir,
	addServerImportsDir,
	addServerHandler
  } from '@nuxt/kit'
import defu from 'defu'
import { randomUUID } from 'node:crypto'
import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ModuleOptions } from './types'

const meta = {
	name: '@nhealth/fhir',
	version: '0.1',
	configKey: 'fhir',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		serverUrl: 'http://localhost:8103'
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui');
		}
		nuxt.options.css.push(resolve('./runtime/tailwind.css'));

		// add all app related things here
		addPlugin(resolve('./runtime/app/plugins/medplum'));
		addImports({
			name: 'useMedplum',
			as: 'useMedplum',
			from: resolve('./runtime/app/composables/useMedplum')
		});
		addComponentsDir({
			path: resolve('./runtime/app/components'),
			prefix: 'Fhir',
			global: true
		});

		// add all server related things here
		addServerImportsDir(resolve('./runtime/server/utils'));
		addServerHandler({
		  handler: resolve('./runtime/server/api/session.delete'),
		  route: '/api/_auth/session',
		  method: 'delete',
		});
		addServerHandler({
		  handler: resolve('./runtime/server/api/session.get'),
		  route: '/api/_auth/session',
		  method: 'get',
		});

		// START AUTH SESSION CONFIG based on nuxt-auth-utils
		const runtimeConfig = nuxt.options.runtimeConfig;
		const envSessionPassword = `${
			runtimeConfig.nitro?.envPrefix || 'NUXT_'
		}SESSION_PASSWORD`;

		type SessionConfig ={
			name: string;
			password: string;
			cookie: {
				sameSite: 'lax' | 'strict' | 'none';
			};
		};


		runtimeConfig.session = defu(runtimeConfig.session || {}, {
			name: 'fhir-session',
			password: process.env[envSessionPassword] || '',
			cookie: {
				sameSite: 'lax',
			},
		});

		// Generate the session password
		//@ts-ignore
		if (nuxt.options.dev && runtimeConfig.session && !runtimeConfig.session?.password) {
			//@ts-ignore
			runtimeConfig.session.password = randomUUID().replace(/-/g, '');
			// Add it to .env
			const envPath = join(nuxt.options.rootDir, '.env');
			const envContent = await readFile(envPath, 'utf-8').catch(() => '');
			if (!envContent.includes(envSessionPassword)) {
				await writeFile(
				envPath,
				`${
					envContent ? envContent + '\n' : envContent
					//@ts-ignore
				}${envSessionPassword}=${runtimeConfig.session?.password}`,
				'utf-8',
				);
			}
		}
		// END AUTH SESSION CONFIG based on nuxt-auth-utils

		runtimeConfig.public.fhir = defu(runtimeConfig.public.fhir || {}, {
			serverUrl: options.serverUrl
		});

		nuxt.options.alias['#fhir'] = resolve('./runtime/types.d.ts');

	}
});