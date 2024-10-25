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
	extendPages,
	addServerHandler,
	addPrerenderRoutes
  } from '@nuxt/kit';
import { fishForFiles, createFhirDocs, initializeWatcher, initializeProfilingContext, buildProfiles } from './sushi';
import { join } from 'node:path';
import type {
	FhirProfilingDocumentation,
	FhirProfilingLayer,
	FhirProfilingParallelProcessing
} from './types/profiling';
import { defu } from 'defu';

const meta = {
	name: '@nhealth/fhir-profiling',
	version: '0.1',
	configKey: 'fhirProfiling'
};

type ModuleOptions = {
	dir?: string;
	outDir?: string;
	verbose?: boolean;
	documentation?: FhirProfilingDocumentation;
	parallelProcessing?: FhirProfilingParallelProcessing;
}

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		dir: 'profiling',
		outDir: '.nuxt/fhir-profiling',
		verbose: true,
		documentation: {
			enabled: true,
		},
		parallelProcessing: {
			enabled: false,
			dir: 'fsh-profiling'
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

		let projectPath = nuxt.options.srcDir;
		const layers = [] as FhirProfilingLayer[];
		for (const [i, layer] of nuxt.options._layers.entries()) {
			layers.push({
				cwd: layer.config.rootDir,
				dir: layer.config?.sourceOptions?.dir || options.dir || 'profiling'
			});
			// Always use base layer as project folder
			if(i===0) projectPath = layer.config.rootDir;
		}

		let profilingContext = initializeProfilingContext({
			projectPath,
			profilingDir: options.dir || 'profiling',
			outDir: options.outDir || '.nuxt/fhir-profiling',
			layers,
			snapshot: true,
			documentation: options.documentation || {},
			parallelProcessing: options.parallelProcessing || {
				enabled: false,
				dir: 'fsh-profiling'
			}
		});

		profilingContext = await fishForFiles(profilingContext);

		await buildProfiles(profilingContext);

		if(options.documentation?.enabled){
			logger.info('Fhir Profiling: Creating FHIR Docs');
			createFhirDocs(profilingContext);
		}

		if(nuxt.options.dev){
			initializeWatcher(profilingContext);
		}


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
					  base: join(projectPath, options?.outDir || '', 'content')
					},
					// add project content folder for additional docs and overrides
					project: {
						driver: 'fs',
						base: join(projectPath, options?.dir || '', 'content')
					}
				}
			});
		}

		const runtimeConfig = nuxt.options.runtimeConfig || {};

		runtimeConfig.fhirProfiling = defu(runtimeConfig.fhirProfiling || {}, {
			resourcesDir: join(projectPath, options?.outDir || '', 'resources'),
		})

		addServerHandler({
			method: 'get',
			route: "/_resources/:resourceType",
			handler: resolve('./runtime/server/resources'),
		});

		const modulePublicDir = resolve('./runtime/public');

		if(!hasNuxtModule('@nuxt/image')){
			installModule('@nuxt/image', {
				dir: modulePublicDir
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

		// add folder to public assets: modulePublicDir
		nuxt.hook('nitro:config', async (nitroConfig) => {
			nitroConfig.publicAssets ||= [];

			nitroConfig.publicAssets.push({
			  dir: modulePublicDir,
			  maxAge: 60 * 60 * 24 * 365
			});
		});

		// add prerendering for fhir resources
		if(!nuxt.options.dev && profilingContext.files.length>0){
			for (const file of profilingContext.profiles.map(p => p.fileName)) {
				addPrerenderRoutes(`/_resources/${file}`);
			}
		}

		// default app config for fhirDocs
		const appConfigFile = await resolvePath(resolve('./runtime/app.config'))
		nuxt.hook('app:resolve', (app) => {
			app.configs.push(appConfigFile)
		})
	}
})