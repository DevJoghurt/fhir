import { globby } from 'globby';
import { useLogger } from '@nuxt/kit';
import { sushiExport, sushiImport, fhirdefs, utils, fshtypes } from 'fsh-sushi';
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { defu } from 'defu';
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

type CreateFhirOptions = {
	rootDir: string;
	outDir: string;
	snapshot: boolean;
};

export async function createFhirResources(files: string[], opts: CreateFhirOptions): Promise<void> {
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

	 const { skippedResources } = utils.writeFHIRResources(opts.outDir, outPackage, defs, opts.snapshot);

	 if (skippedResources.length > 0) {
	   logger.warn(
		 `The following resources were skipped due to errors during conversion: ${skippedResources.join(
		   ', '
		 )}`
	   );
	 }

	 createFhirDocs(opts.outDir);

}

export function createFhirDocs(dir: string) {

	// Write out the markdown
	const doc = new Markdown();
	doc.meta({
		title: 'FHIR Implementation Guide',
		description: 'This is a generated FHIR Implementation Guide.',
		layout: 'fhirdocs'
	});
	doc.heading('FHIR Implementation Guide', 1);
	doc.text('This is a generated FHIR Implementation Guide.');
	doc.heading('Table of Contents', 2);
	doc.text('This is a table of contents.');
	doc.heading('Introduction', 2);
	doc.text('This is an introduction.');
	doc.component('ResourceContent', {
		resource: 'structuredefinition-researchstudy'
	});
	const markdownFilePath = join(dir, 'fsh-generated','content', 'index.md');
	doc.save(markdownFilePath);

}

export function defineSushiConfig(config: SushiConfiguration) {
	return defu(config, {
		FSHOnly: true
	});
}