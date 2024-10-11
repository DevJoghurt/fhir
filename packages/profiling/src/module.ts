import {
	defineNuxtModule,
	createResolver,
	hasNuxtModule,
	installModule,
	useLogger,
	addComponentsDir
  } from '@nuxt/kit';
  import { readFSHFiles, createFhirResources } from './sushi';
  import { join } from 'node:path';

const meta = {
	name: '@nhealth/fhir-profiling',
	version: '0.1',
	configKey: 'fhirProfiling'
};

type ModuleOptions = {
	dir?: string;
	verbose?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		dir: 'profiles',
		verbose: true
	},
	async setup(options, nuxt) {
		const logger = useLogger('FHIR Profiling');
		const { resolve } = createResolver(import.meta.url);
		// TODO: find a way to handle tailwind css import from different modules
		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui');
		}

		// get all fsh files in profiles/fsh folder for fhir sushi -> respecting nuxt layers
		logger.info('Fhir Profiling: Reading FSH files');
		const fshFiles = [] as string[];
		let projectFolder = nuxt.options.srcDir;
		for (const [i, layer] of nuxt.options._layers.entries()) {
			const files = await readFSHFiles(layer.config);
			if(options.verbose){
				for (const file of files) {
					logger.info(`Found FSH file: ${file}`);
				}
			}
			fshFiles.push(...files);
			// Always use base layer as project folder
			if(i===0) projectFolder = layer.config.rootDir;
		}

		// Create FHIR Implementation Guides
		await createFhirResources(fshFiles, {
			rootDir: projectFolder,
			outDir: projectFolder,
			snapshot: true
		});

		if(!hasNuxtModule('@nuxt/content')){
			installModule('@nuxt/content', {
				documentDriven: true,
				sources: {
					// overwrite default source AKA `content` directory
					content: {
					  driver: 'fs',
					  prefix: '/docs', // All contents inside this source will be prefixed with `/`
					  base: join(projectFolder, 'fsh-generated')
					}
				}
			});
		}

		addComponentsDir({
			path: resolve('./runtime/components'),
			global: true,
			watch: true
		});
	}
})