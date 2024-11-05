import { globby } from 'globby';
import { useLogger } from '@nuxt/kit';
import { sushiExport, sushiImport, fhirdefs, utils, fshtypes } from 'fsh-sushi';
import { watch } from 'chokidar';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import fse from 'fs-extra';
import { resolve, join } from 'node:path';
import { defu } from 'defu';
import { createLandingPage, createResourceProfiles, createTerminologies } from './generator'
import Markdown from './markdown';
import type { InstanceDefinition } from 'fsh-sushi/dist/fhirtypes';
import { loadConfig } from "c12";

type InstanceMeta = InstanceDefinition['_instanceMeta'];

interface ProfileExample extends InstanceMeta {
	fileName: string;
}

export type SushiConfiguration = Pick<fshtypes.Configuration, 'canonical' | 'description' | 'fhirVersion' | 'dependencies' | 'parameters' | 'publisher'>;

// General types

export type FhirProfilingProfile = {
	id: string | undefined;
	resourceType: string;
	url: string;
	version: string | undefined;
	title: string;
	description: string;
	status: string | undefined;
	kind: string;
	baseDefinition: string;
	inProgress: boolean;
	examples: ProfileExample[];
	fileName: string;
};

export type FhirProfilingValueSet = {
	id: string | undefined;
	resourceType: 'ValueSet';
	url: string;
	version: string | undefined;
	title: string;
	description: string;
	status: string | undefined;
};


export type FhirProfilingCodeSystem = {
	id: string | undefined;
	resourceType: 'CodeSystem';
	url: string | undefined;
	version: string | undefined;
	title: string | undefined;
	description: string | undefined;
	status: string | undefined;
	date: string | undefined;
};

export type FhirProfilingDocs = {
	enabled: boolean;
	layout: 'fhirdocs';
	site: {
		name: string;
		description: string;
		ogImage: string;
		ogImageComponent: string;
	},
	header: {
		showLoadingIndicator: boolean;
		title: string;
		logo: {
			light: string;
			dark: string;
		},
		showTitleInMobile: boolean;
		border: boolean;
		darkModeToggle: boolean;
		nav: [];
		links: [];
	},
	aside: {
		useLevel: boolean;
		collapse: boolean;
	},
	main: {
		breadCrumb: boolean;
		showTitle: boolean;
		codeCopyToast: boolean;
		codeCopyToastText: string;
		fieldRequiredText: string;
		padded: boolean;
		codeIcon: Record<string, string>;
	},
	toc: {
		enable: boolean;
		enableInMobile: boolean;
		title: string;
		links: [];
		ignoreDirs: [];
	},
	search: {
		enable: boolean;
		inAside: boolean;
		style: string;
		placeholder: string;
		placeholderDetailed: string;
	}
};

export type FhirProfilingParallelProcessing = {
	enabled: boolean;
	dir: string;
};


export type FhirProfilingLayer = {
	cwd: string;
	dir: string;
};

export type FhirProfilingPaths = {
	projectPath: string;
	profilingDir: string;
	sushiConfig?: string;
	outDir: string;
	parallelProcessing: FhirProfilingParallelProcessing;
};

/**
 * TODO: Add more configuration options
 */
export type FhirProfilingConfig = {
	docs: Partial<FhirProfilingDocs>,
	paths: FhirProfilingPaths,
	sushi: Partial<SushiConfiguration>;
}

export interface FhirProfilingContext extends FhirProfilingConfig {
	snapshot: boolean;
	verbose: boolean;
	layers: FhirProfilingLayer[] | false;
	files: string[];
	profiles: FhirProfilingProfile[];
	valueSets: FhirProfilingValueSet[];
	codeSystems: FhirProfilingCodeSystem[];
};

interface ProfilingBaseConfig extends FhirProfilingPaths {
	docs: Partial<FhirProfilingDocs>;
	snapshot: boolean;
	layers?: FhirProfilingLayer[] | false;
};

export async function initializeProfilingContext(config: ProfilingBaseConfig): Promise<FhirProfilingContext>{
	const context = {
		snapshot: config.snapshot,
		verbose: true,
		paths: {
			projectPath: config.projectPath,
			profilingDir: config.profilingDir,
			sushiConfig: config?.sushiConfig || undefined,
			outDir: config.outDir,
			parallelProcessing: config.parallelProcessing
		},
		sushi: defineFhirProfiling({}),
		layers: config.layers || false,
		docs: config.docs,
		files: [],
		profiles: [],
		valueSets: [],
		codeSystems: []
	} as FhirProfilingContext;

	// load fhir profiling configuration from fhir.profiling.ts
	// TODO respect nuxt layers
	const fhirProfilingContext = await loadConfig<FhirProfilingContext>({
		configFile: 'fhir.profiling',
		cwd: context.paths.projectPath,
		defaults: context
	});

	// TODO: add sushi configuration if available
	if(fhirProfilingContext.config.paths.sushiConfig){

	}

	return fhirProfilingContext.config;
}

export async function readProfilingFolder(layer: FhirProfilingLayer): Promise<string[]> {

	const files = await globby(`${layer.dir}/fsh/**/*.fsh`, {
		cwd: layer.cwd,
		absolute: true,
		deep: 2,
	});

  	return files;
}

export async function fishForFiles(context: FhirProfilingContext): Promise<FhirProfilingContext> {
	const logger = useLogger();
	// reset files
	context.files = [];

	if(context.layers && context.layers.length > 0){
		for (const [i, layer] of context.layers.entries()) {
			const files = await readProfilingFolder(layer);
			context.files.push(...files);
		}
	} else{
		const files = await readProfilingFolder({
			cwd: context.paths.projectPath,
			dir: context.paths.profilingDir
		});
		context.files.push(...files);
	}
	if(context.verbose){
		for (const file of context.files) {
			logger.info(`Found FSH file: ${file}`);
		}
	}

	return context
}


/**
 * 	cc. Apache License, Version 2.0: https://github.com/FHIR/sushi/blob/master/src/utils/Processing.ts
 *
 * Needs to be refactored to make the output more flexible
 *
 */

export function writeFHIRResources(
	context: FhirProfilingContext,
	outPackage: sushiExport.Package,
	defs: fhirdefs.FHIRDefinitions
  ) {
	const logger = useLogger();
	logger.info('Exporting FHIR resources as JSON...');
	let count = 0;
	const skippedResources: string[] = [];
	const predefinedResources = defs.allPredefinedResources(false);
	const writeResources = (
	  resources: {
		getFileName: () => string;
		toJSON: (snapshot: boolean) => any;
		url?: string;
		id?: string;
		resourceType?: string;
	  }[]
	) => {
	  const exportDir = join(context.paths.projectPath, context.paths.outDir, 'resources');
	  resources.forEach(resource => {
		if (
		  !predefinedResources.find(
			predef =>
			  predef.url === resource.url &&
			  predef.resourceType === resource.resourceType &&
			  predef.id === resource.id
		  )
		) {
		  utils.checkNullValuesOnArray(resource);
		  fse.outputJSONSync(join(exportDir, resource.getFileName()), resource.toJSON(context.snapshot), {
			spaces: 2
		  });
		  if(context.paths.parallelProcessing.enabled){
			fse.outputJSONSync(join(context.paths.projectPath, context.paths.parallelProcessing.dir, resource.getFileName()), resource.toJSON(context.snapshot), {
				spaces: 2
			});
		  }
		  count++;
		} else {
		  logger.error(
			`Ignoring FSH definition for ${
			  resource.url ?? `${resource.resourceType}/${resource.id}`
			} since it duplicates existing pre-defined resource. ` +
			  'To use the FSH definition, remove the conflicting file from "input". ' +
			  'If you do want the FSH definition to be ignored, please comment the definition out ' +
			  'to remove this error.'
		  );
		  skippedResources.push(resource.getFileName());
		}
	  });
	};
	writeResources(outPackage.profiles);
	writeResources(outPackage.extensions);
	writeResources(outPackage.logicals);
	// WARNING: While custom resources are written to disk, the IG Publisher does not
	//          accept newly defined resources. However, it is configured to automatically
	//          search the fsh-generated directory for StructureDefinitions rather than using
	//          the StructureDefinitions defined in the exported implementation guide. So, be
	//          aware that the IG Publisher will attempt to process custom resources.
	//          NOTE: To mitigate against this, the parameter 'autoload-resources = false' is
	//          injected automatically into the IG array pf parameters if the parameter was
	//          not already defined and only if the custom resources were generated by Sushi.
	writeResources(outPackage.resources);
	writeResources([...outPackage.valueSets, ...outPackage.codeSystems]);

	// Filter out inline instances
	writeResources(outPackage.instances.filter(i => i._instanceMeta.usage !== 'Inline'));

	logger.info(`Exported ${count} FHIR resources as JSON.`);
	return { skippedResources };
}

export async function buildProfiles(context: FhirProfilingContext): Promise<FhirProfilingContext> {
	const logger = useLogger();

	let rawFSH = [] as sushiImport.RawFSH[];
	if(context.files.length > 0){
		rawFSH = context.files.map(file => {
			const filePath = resolve(file);
			const fileContent = readFileSync(filePath, 'utf8');
			return new sushiImport.RawFSH(fileContent, filePath);
		})
	}

	const docs = sushiImport.importText(rawFSH);

	const sushiConfig = context.sushi as fshtypes.Configuration;

	const tank = new sushiImport.FSHTank(docs, sushiConfig);

	const defs = new fhirdefs.FHIRDefinitions();

	await utils.loadExternalDependencies(defs, sushiConfig);

	// Load custom resources. In current tank configuration (input/fsh), resources will be in input/
	fhirdefs.loadCustomResources(join(context.paths.projectPath, context.paths.profilingDir), join(context.paths.projectPath, context.paths.profilingDir), sushiConfig?.parameters || [], defs);

	 // Check for StructureDefinition
	 const structDef = defs.fishForFHIR('StructureDefinition', utils.Type.Resource);
	 if (structDef == null || !utils.isSupportedFHIRVersion(structDef.version)) {
	   logger.error(
		 'Valid StructureDefinition resource not found. The FHIR package in your local cache' +
		   ' may be corrupt. Local FHIR cache can be found at <home-directory>/.fhir/packages.' +
		   ' For more information, see https://wiki.hl7.org/FHIR_Package_Cache#Location.'
	   );
	 }

	 logger.info('Converting FSH to FHIR resources...');

	 const outPackage = sushiExport.exportFHIR(tank, defs);

	// Create content map for writing docs
	// transform filename into queryId -> lowercase and replace spaces with '-' and remove ending .json
	//const transformFileName = (fileName: string) => fileName.toLowerCase().replace(/ /g, '-').replace('.json', '');
	// empty context profiles
	context.profiles = [];
	for (const profile of outPackage.profiles) {
		const { id, resourceType, url, version, title, description, status, kind, baseDefinition, inProgress = false } = profile;
		const fileName = profile.getFileName();
		context.profiles.push({
			id,
			resourceType,
			url,
			version,
			title,
			description,
			status,
			kind,
			baseDefinition,
			inProgress,
			examples: [],
			fileName: fileName
		});
	}
	for (const instance of outPackage.instances) {
		const { _instanceMeta } = instance;
		// filter out examples
		if (_instanceMeta.usage === 'Example') {
			// find profile for example
			const profile = context.profiles.find(p => p.url === _instanceMeta.instanceOfUrl);
			profile?.examples.push({
				..._instanceMeta,
				fileName: instance.getFileName()
			});
			continue;
		}
	}
	// empty context valueSets
	context.valueSets = [];
	for (const valueSet of outPackage.valueSets) {
		const { id, resourceType, url, version, title, description, status } = valueSet;
		context.valueSets.push({ id, resourceType, url, version, title, description, status });
	}
	// empty context codeSystems
	context.codeSystems = [];
	for (const codeSystem of outPackage.codeSystems) {
		const { id, resourceType, url, version, title, description, status, date } = codeSystem;
		context.codeSystems.push({ id, resourceType, url, version, title, description, status, date });
	}

	// write FHIR resources to disk
	const { skippedResources } = writeFHIRResources(context, outPackage, defs);

	if (skippedResources.length > 0) {
	   logger.warn(
		 `The following resources were skipped due to errors during conversion: ${skippedResources.join(
		   ', '
		 )}`
	   );
	}

	// return fhir profiling context
	return context;
}

export function createFhirDocs(ctx: FhirProfilingContext) {
	// Empty content folder
	const contentDir = join(ctx.paths.projectPath, ctx.paths.outDir, 'content');
	// check if content folder exists and delete it
	if (existsSync(contentDir)) {
		rmSync(contentDir, { recursive: true });
	}

	// Create landing page as an overview of the FHIR Implementation Guide
	createLandingPage(ctx);

	// Create a page for each resource profile
	createResourceProfiles(ctx);

	// Create a page for each resource profile
	createTerminologies(ctx);

	// add _dir.yml to resources folder to exclude it from docs navigation
	// TODO: check if it is better to include it and create a page for it
	const dirYml = new Markdown();
	dirYml.value('navigation', 'false');
	dirYml.save(ctx.paths.projectPath, ctx.paths.outDir, 'resources', '_dir.yml');
}

export function initializeWatcher(ctx: FhirProfilingContext){
	const logger = useLogger();

	const dir = join(ctx.paths.projectPath, ctx.paths.profilingDir, 'fsh');
    const watcher = watch(dir, {
		ignoreInitial: true,
		depth: 0,
		ignored: []
	})

	watcher.on('all', async (event, path) => {
		logger.log(event, path);
		if(event === 'add' || event === 'unlink'){
			ctx = await fishForFiles(ctx);
		}
		if( ['change', 'add', 'unlink'].indexOf(event) !== -1){
			ctx = await buildProfiles(ctx);
			if(ctx.docs?.enabled){
				createFhirDocs(ctx);
			}
		}
	})
}

export function defineFhirProfiling(config: Partial<FhirProfilingConfig>) {

	return defu(config, {
		sushi: {
			FSHOnly: true,
			fhirVersion: ['4.0.1'],
			canonical: 'http://example.com/fsh',
			dependencies: [{
				packageId: "hl7.fhir.us.core",
				version: "3.1.0"
			}],
			parameters: []
		}
	});
}