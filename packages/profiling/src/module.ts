import {
	defineNuxtModule,
	createResolver,
	hasNuxtModule,
	installModule,
	useLogger,
	addComponentsDir,
	addLayout,
	resolvePath,
	addImportsDir,
	extendPages
  } from '@nuxt/kit';
  import { readFSHFiles, initializeProfiling, createFhirDocs } from './sushi';
  import { join } from 'node:path';
  import { FhirProfilingDocumentation } from './types';

const meta = {
	name: '@nhealth/fhir-profiling',
	version: '0.1',
	configKey: 'fhirProfiling'
};



type ModuleOptions = {
	dir?: string;
	verbose?: boolean;
	documentation?: FhirProfilingDocumentation;
}

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		dir: 'profiling',
		verbose: true,
		documentation: {
			enabled: true,
		}
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
		const fhirProfilingContext = await initializeProfiling(fshFiles, {
			rootDir: projectFolder,
			outDir: projectFolder,
			snapshot: true,
			documentation: options.documentation || {}
		});

		await createFhirDocs(fhirProfilingContext);


		if(!hasNuxtModule('@nuxt/content')){
			installModule('@nuxt/content', {
				documentDriven: {
					injectPage: false
				},
				navigation: {
					fields: ['icon'],
				},
				experimental: {
					search: true,
				},
				sources: {
					// add fhir profiling generated docs
					content: {
					  driver: 'fs',
					  base: join(projectFolder, 'fsh-generated', 'content')
					},
					// add fhir resources for querying
					// TODO: add a way to query fhir resources without using nuxt content
					resources: {
						driver: 'fs',
						prefix: '/profiling',
						base: join(projectFolder, 'fsh-generated', 'resources')
					},
					// add project content folder for additional docs and overrides
					project: {
						driver: 'fs',
						base: join(projectFolder, options?.dir || '', 'content')
					}
				}
			});
		}

		const publicDir = resolve('./runtime/public');

		if(!hasNuxtModule('@nuxt/image')){
			installModule('@nuxt/image', {
				dir: publicDir
			});
		}

		// Add fhir docs related things
		addImportsDir(resolve('./runtime/composables'));
		addLayout(resolve('./runtime/layouts/fhirdocs.vue'), 'fhirdocs');
		addComponentsDir({
			path: resolve('./runtime/components'),
			global: true,
			watch: true
		});

		nuxt.options.pages = true;

		extendPages((pages) => {
			// Respect user's custom catch-all page
			if (!pages.find(page => page.path === '/:slug(.*)*')) {
				pages.unshift({
					name: 'slug',
					path: '/:slug(.*)*',
					file: resolve('./runtime/pages/docs.vue'),
					children: [],
					meta: {
						layout: 'fhirdocs'
					}
				})
			}
		});
		nuxt.hook('nitro:config', async (nitroConfig) => {
			nitroConfig.publicAssets ||= []
			nitroConfig.publicAssets.push({
			  dir: publicDir,
			  maxAge: 60 * 60 * 24 * 365
			})
		})
		// default app config for fhirDocs
		const appConfigFile = await resolvePath(resolve('./runtime/app.config'))
		nuxt.hook('app:resolve', (app) => {
			app.configs.push(appConfigFile)
		})
	}
})