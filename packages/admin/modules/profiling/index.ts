import {
	defineNuxtModule,
	addServerImports,
	addServerScanDir,
	createResolver,
	addComponentsDir
  } from '@nuxt/kit'
import { lstat } from 'node:fs/promises'
import { analyzePackageDirs } from './utils'
import { createPackageProfileTemplate } from './template'

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
		nuxt.options.nitro.experimental.websocket = true

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
		// otherwsie it makes dev environment slow

		const {
			meta,
			assets
		} = await analyzePackageDirs(profilingPaths)

		createPackageProfileTemplate(meta)

		addServerImports([
			{
				name: 'getFhirProfileMeta',
				as: 'getFhirProfileMeta',
				from: resolve(nuxt.options.buildDir, 'profiling-packages'),
			},{
				name: 'getFhirProfileData',
				as: 'getFhirProfileData',
				from: resolve(nuxt.options.buildDir, 'profiling-packages'),
			},{
				name: 'getFhirPackages',
				as: 'getFhirPackages',
				from: resolve(nuxt.options.buildDir, 'profiling-packages'),
			}
		])

		addServerScanDir(resolve('./server'))

		addComponentsDir({
			path: resolve('./app/components'),
			prefix: 'Fhir',
			global: true
		})

		console.log(assets)
		// add profiles to server assets
		for(const profileAsset of assets){
			if(nuxt.options.nitro.serverAssets === undefined){
				nuxt.options.nitro.serverAssets = []
			}
			nuxt.options.nitro.serverAssets.push({
				baseName: profileAsset.name,
				dir: profileAsset.resolvedPath
			})
		}

	}
})