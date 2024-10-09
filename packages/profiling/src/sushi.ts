import { globby } from 'globby';
import type { NuxtConfigLayer } from '@nuxt/schema';
import { useLogger } from '@nuxt/kit';
import { sushiExport, sushiImport, fhirdefs, utils, fshtypes } from 'fsh-sushi';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export async function readFSHFiles(layerConfig: NuxtConfigLayer['config']): Promise<string[]> {

	const files = await globby('profiles/fsh/**/*.fsh', {
		cwd: layerConfig.rootDir,
		absolute: true,
		deep: 2,
	});

  	return files;
}

type CreateFhirOptions = {
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

	const config = {
		FSHOnly: true,
		fhirVersion: ['4.0.1'],
		canonical: 'http://example.com/fsh',
		dependencies: [{packageId: "hl7.fhir.us.core", version: "3.1.0"}]
	} as fshtypes.Configuration;

	const tank = new sushiImport.FSHTank(docs, config);

	const defs = new fhirdefs.FHIRDefinitions();

	await utils.loadExternalDependencies(defs, config);

	 // Load custom resources. In current tank configuration (input/fsh), resources will be in input/
	 if(config.parameters){
		//TODO: fhirdefs.loadCustomResources(path.join(input, '..'), originalInput, config.parameters, defs);
	 }

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
}