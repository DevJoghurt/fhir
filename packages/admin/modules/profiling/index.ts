import {
	defineNuxtModule,
	addServerImports,
	addServerScanDir,
	createResolver,
	addComponentsDir
  } from '@nuxt/kit'
import { lstat } from 'node:fs/promises'
import { importLocalProfilingDirs } from './utils'
import type { Package } from './types'
import { name } from 'tar/types'

declare module '@nuxt/schema' {
	interface RuntimeConfig {
	  profiling: {
		packages: Package[];
	  }
	}
}

export type ModuleOptions = {
	profilingDir: string;
}

const meta = {
	name: '@nhealth/profiling',
	version: '0.1',
	configKey: 'profiling',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		profilingDir: 'profiling',
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url)

		nuxt.options.alias['#fhirtypes/profiling'] = resolve('./types');

		// activate websocket support
		if(!nuxt.options.nitro.experimental){
			nuxt.options.nitro.experimental = {}
		}
		nuxt.options.nitro.experimental.database = true

		// add profiling sqlite database
		if(!nuxt.options.nitro.database){
			nuxt.options.nitro.database = {}
		}
		nuxt.options.nitro.database.profiling = {
			connector: 'sqlite',
			options: {
				name: 'profiling',
			}
		}

		const profilingPaths = [] as string[]
		for (const layer of nuxt.options._layers) {
			//check if path is available as dir with stat
			try {
				const profilingPath = resolve(layer.config?.serverDir || '', options.profilingDir)
				const statFolder = await lstat(profilingPath)
				if (statFolder.isDirectory()) {
					profilingPaths.push(profilingPath)
				}
			} catch (error) {
				// ignore
			}
		}

		//TODO: exclude profiling paths from watch paths of nitro and nuxt -> nuxt.options.watch.exclude
		// otherwise it makes dev environment slow

		await importLocalProfilingDirs(profilingPaths, nuxt.options)


		addServerScanDir(resolve('./server'))

		addComponentsDir({
			path: resolve('./app/components'),
			prefix: 'Fhir',
			global: true
		})

	}
})