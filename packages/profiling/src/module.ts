import {
	defineNuxtModule,
	createResolver,
	hasNuxtModule,
	installModule,
	useLogger,
	addComponentsDir,
	addLayout,
	addImportsDir,
	extendPages,
	addServerHandler,
	addPrerenderRoutes
  } from '@nuxt/kit';
import { fishForFiles, createFhirDocs, initializeWatcher, initializeProfilingContext, buildProfiles } from './profiling';
import { join } from 'node:path';
import type {
	FhirProfilingDocs,
	FhirProfilingLayer,
	FhirProfilingParallelProcessing
} from './profiling';
import { defu }  from 'defu';

const meta = {
	name: '@nhealth/fhir-profiling',
	version: '0.1',
	configKey: 'profiling'
};

type ModuleOptions = {
	profilingDir?: string;
	contentDir?: string;
	outDir?: string;
	verbose?: boolean;
	sushiConfig?: boolean;
	docs?: Partial<FhirProfilingDocs>;
	parallelProcessing?: FhirProfilingParallelProcessing;
}

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		profilingDir: 'profiling',
		contentDir: 'content',
		outDir: '.nuxt/fhir-profiling',
		verbose: true,
		sushiConfig: true,
		docs: {
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
		// TODO: find a better way to handle tailwind css import from different modules
		if(!hasNuxtModule('@nuxt/ui')){
			installModule('@nuxt/ui');
			nuxt.options.css.push(resolve('./runtime/tailwind.css'));
		}

		// get all fsh files in profiles/fsh folder for fhir sushi -> respecting nuxt layers
		logger.info('Fhir Profiling: Reading FSH files');

		let projectPath = nuxt.options.srcDir;
		const layers = [] as FhirProfilingLayer[];
		for (const [i, layer] of nuxt.options._layers.entries()) {
			layers.push({
				cwd: layer.config.rootDir,
				//@ts-ignore
				dir: layer.config?.sourceOptions?.profilingDir || options.profilingDir || 'profiling'
			});
			// Always use base layer as project folder
			if(i===0) projectPath = layer.config.rootDir;
		}

		let profilingContext = await initializeProfilingContext({
			projectPath,
			profilingDir: options.profilingDir || 'profiling',
			outDir: options.outDir || '.nuxt/fhir-profiling',
			sushiConfig: options.sushiConfig,
			layers,
			snapshot: true,
			docs: options.docs || {},
			parallelProcessing: options.parallelProcessing || {
				enabled: false,
				dir: 'fsh-profiling'
			}
		});

		profilingContext = await fishForFiles(profilingContext);

		await buildProfiles(profilingContext);

		if(options.docs?.enabled){
			logger.info('Fhir Profiling: Creating FHIR Docs');
			createFhirDocs(profilingContext);
		}

		if(nuxt.options.dev){
			initializeWatcher(profilingContext);
		}

		// add fhir profiling context to app.config
		nuxt.options.appConfig.fhirDocs = defu(nuxt.options.appConfig.fhirDocs || {},{
			site: profilingContext.docs?.site || {},
			header: profilingContext.docs?.header || {},
		});


		if(!hasNuxtModule('@nuxt/content')){
			installModule('@nuxt/content', {
				documentDriven: {
					injectPage: false
				},
				navigation: {
					fields: ['icon'],
				},
				highlight: {
					theme: {
					  default: 'github-light',
					  dark: 'github-dark',
					},
					preload: ['json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell', 'markdown', 'yaml', 'bash', 'ini'],
				},
				experimental: {
					// @ts-ignore
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
						base: join(projectPath, options?.contentDir || 'content')
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
			handler: resolve('./runtime/server/api/resources'),
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
	}
})