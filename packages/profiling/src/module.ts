import {
	defineNuxtModule,
	createResolver,
	hasNuxtModule,
	installModule,
	useLogger
  } from '@nuxt/kit';
  import { join } from 'node:path';
  import { readFSHFiles, createFhirResources } from './sushi';

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
		for (const layer of nuxt.options._layers) {
			const files = await readFSHFiles(layer.config);
			if(options.verbose){
				for (const file of files) {
					logger.info(`Found FSH file: ${file}`);
				}
			}
			fshFiles.push(...files);
		}
		// Create FHIR Implementation Guides
		createFhirResources(fshFiles, {
			outDir: join(nuxt.options.rootDir, 'export'),
			snapshot: true
		});
	}
})