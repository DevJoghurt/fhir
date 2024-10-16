import {
	defineNuxtModule,
	createResolver,
	hasNuxtModule,
	installModule,
	useLogger,
	addComponentsDir,
	addLayout
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
		dir: 'profiling',
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
					// add fhir profiling generated docs
					content: {
					  driver: 'fs',
					  prefix: '/docs',
					  base: join(projectFolder, 'fsh-generated', 'content')
					},
					// add fhir resources for querying
					resources: {
						driver: 'fs',
						prefix: '/profiling',
						base: join(projectFolder, 'fsh-generated', 'resources')
					},
					// add project content folder for additional docs and overrides
					project: {
						driver: 'fs',
						prefix: '/docs',
						base: join(projectFolder, options?.dir || '', 'content')
					}
				}
			});
		}

		// Add fhir docs related things
		addLayout({
			src: resolve('./runtime/layouts/fhirdocs.vue')
		});
		addComponentsDir({
			path: resolve('./runtime/components'),
			global: true,
			watch: true
		});
	}
})