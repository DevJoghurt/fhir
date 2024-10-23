import { overrideEnv } from './env';
import { clearBuildDir } from './fs'
import { consola } from 'consola';
import { loadNuxt, writeTypes, buildNuxt } from '@nuxt/kit';
import type { FhirProfilingContext } from '@nhealth/fhir-profiling/types';

export async function buildDocs(ctx: FhirProfilingContext){
	overrideEnv('production');

	const buildDir = `${ctx.config.outDir}/.build`;

    const nuxt = await loadNuxt({
		cwd: ctx.config.projectPath,
		dotenv: {
		  cwd: ctx.config.projectPath
		},
		defaultConfig: {
			buildDir: buildDir,
			modules: [
				[
					'@nhealth/fhir-profiling', {
						dir: ctx.config.profilingDir,
						outDir: `${buildDir}/fhir-profiling`,
					}
				]
			],
		},
		overrides: {
		  logLevel: 'verbose',
		  _generate: true,
		  	...{
				nitro: {
					static: true,
					output: {
						dir: `${ctx.config.outDir}/docs`,
					}
				}
			},
		},
	});

	await clearBuildDir(buildDir);

	await writeTypes(nuxt);

	nuxt.hook('build:error', (err) => {
		consola.error('Nuxt Build Error:', err)
		process.exit(1)
	});

	await buildNuxt(nuxt);
}