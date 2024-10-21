import { globby } from 'globby';
import { useLogger } from '@nuxt/kit';
import { sushiExport, sushiImport, fhirdefs, utils, fshtypes } from 'fsh-sushi';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { defu } from 'defu';
import type { FhirProfilingContext, FhirProfilingDocumentation } from './types';
import { createLandingPage } from './generator'
import Markdown from './markdown';

const profileFolder = 'profiling';

type ReadFSHFilesOptions = {
	rootDir: string;
};

export type SushiConfiguration = Pick<fshtypes.Configuration, 'canonical' | 'description' | 'fhirVersion' | 'dependencies' | 'parameters'>

export async function readFSHFiles(config: ReadFSHFilesOptions): Promise<string[]> {

	const files = await globby(`${profileFolder}/fsh/**/*.fsh`, {
		cwd: config.rootDir,
		absolute: true,
		deep: 2,
	});

  	return files;
}

type FhirProfilingOptions = {
	rootDir: string;
	outDir: string;
	snapshot: boolean;
	documentation: FhirProfilingDocumentation;
};

export async function initializeProfiling(files: string[], opts: FhirProfilingOptions): Promise<FhirProfilingContext> {
	const logger = useLogger();
	let rawFSH = [] as sushiImport.RawFSH[];
	if(files.length > 0){
		rawFSH = files.map(file => {
			const filePath = resolve(file);
			const fileContent = readFileSync(filePath, 'utf8');
			return new sushiImport.RawFSH(fileContent, filePath);
		})
	}

	const docs = sushiImport.importText(rawFSH);


	const config = defineSushiConfig({
		fhirVersion: ['4.0.1'],
		canonical: 'http://example.com/fsh',
		dependencies: [{packageId: "hl7.fhir.us.core", version: "3.1.0"}]
	});

	const tank = new sushiImport.FSHTank(docs, config);

	const defs = new fhirdefs.FHIRDefinitions();

	await utils.loadExternalDependencies(defs, config);

	// Load custom resources. In current tank configuration (input/fsh), resources will be in input/
	fhirdefs.loadCustomResources(join(opts.rootDir, profileFolder), join(opts.rootDir, profileFolder), config?.parameters || [], defs);

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
	 const context = createProfilingContext(outPackage, opts);


	 const { skippedResources } = utils.writeFHIRResources(opts.outDir, outPackage, defs, opts.snapshot);

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

export function createProfilingContext(outPackage: sushiExport.Package, opts: FhirProfilingOptions): FhirProfilingContext {
	const context = {
		config: {
			dir: opts.outDir,
			verbose: true,
			documentation: opts.documentation
		},
		profiles: [],
		valueSets: [],
		codeSystems: []
	} as FhirProfilingContext;

	for (const profile of outPackage.profiles) {
		const { id, resourceType, url, version, title, description, status, kind, baseDefinition, inProgress = false } = profile;
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
			fileName: profile.getFileName()
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
	for (const valueSet of outPackage.valueSets) {
		const { id, resourceType, url, version, title, description, status } = valueSet;
		context.valueSets.push({ id, resourceType, url, version, title, description, status });
	}
	for (const codeSystem of outPackage.codeSystems) {
		const { id, resourceType, url, version, title, description, status, date } = codeSystem;
		context.codeSystems.push({ id, resourceType, url, version, title, description, status, date });
	}
	return context;

}

export function createFhirDocs(ctx: FhirProfilingContext) {

	// Create landing page as an overview of the FHIR Implementation Guide
	createLandingPage(ctx);

	// add _dir.yml to resources folder to exclude it from docs navigation
	// TODO: check if it is better to include it and create a page for it
	const dirYml = new Markdown();
	dirYml.value('navigation', 'false');
	dirYml.save(join(ctx.config.dir, 'fsh-generated','resources', '_dir.yml'));
}

export function defineSushiConfig(config: SushiConfiguration) {
	return defu(config, {
		FSHOnly: true
	});
}