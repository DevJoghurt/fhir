/**
 * Cli wrapper for the hl7 publisher workflow
 */
import { consola } from 'consola';
import { join } from 'pathe';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import type { FhirProfilingContext } from '@nhealth/fhir-profiling';

const pubsource = "https://github.com/HL7/fhir-ig-publisher/releases/latest/download/publisher.jar";

function downloadFile(url, outputPath) {
	return fetch(url)
		.then(x => x.arrayBuffer())
		.then(x => writeFile(outputPath, Buffer.from(x)));
}

/**
 * Checks if the Java runtime is installed
 */
export function checkJavaRuntime() {
	consola.info('Checking for Java runtime');
	const { execSync } = require('child_process');
	try {
		execSync('java -version');
	} catch (error) {
		consola.error('Java runtime is required for the HL7 Publisher. Please install Java and try again.');
		process.exit(1);
	}
}

/**
 * Downloads the publisher if not already downloaded
 */
export async function downloadPublisher(ctx: FhirProfilingContext) {
	const publisherPath = join(ctx.paths.profilingDir, 'publisher.jar');
	// check if the publisher is already downloaded -> filename is publisher.jar
	if (!existsSync(publisherPath)) {
		// download the publisher
		consola.info(`Downloading HL7 Publisher from ${pubsource}`);
		// download file with node
		await downloadFile(pubsource, publisherPath);
		consola.success('Publisher downloaded');
	}
}

/**
 * Runs the HL7 Publisher
 * https://confluence.hl7.org/pages/viewpage.action?pageId=175618322
 * TODO: check if fhir-tools-settings.conf is needed in some contexts
 */
export async function runPublisher(ctx: FhirProfilingContext) {
	const publisherPath = join(ctx.paths.profilingDir, 'publisher.jar');
	// check if the publisher is already downloaded -> filename is publisher.jar
	if (!existsSync(publisherPath)) {
		consola.error('HL7 Publisher is not downloaded. Please run the build command first.');
		process.exit(1);
	}
	// run the publisher

	// TODOS:
	// check if files exists -> ig.ini
	// check if sushi config is set FSHOnly: false -> the ImplementationGuide resource is generated and needed in the ig.ini
	// check if sushi config menu is set -> menu.xml is generated

	const { execSync } = require('child_process');
	consola.info('Running HL7 Publisher');
	execSync(`java -jar ${publisherPath} -ig ${join(ctx.paths.projectPath,ctx.paths.profilingDir,'ig.ini')} -destination ${ctx.paths.outDir}`,{
		cwd: '.',
		stdio: 'inherit'
	});
	consola.success('HL7 Publisher completed');
}