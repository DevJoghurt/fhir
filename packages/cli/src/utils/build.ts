import { overrideEnv } from './env';
import { clearBuildDir } from './fs'
import { consola } from 'consola';
import { loadNuxt, writeTypes, buildNuxt } from '@nuxt/kit';
import type { FhirProfilingContext } from '../../../profiling/src/types/profiling';

export async function buildDocs(ctx: FhirProfilingContext){
	overrideEnv('production');

	const buildDir = `${ctx.config.outDir}/.build`;

	// cleanup before loading nuxt
	await clearBuildDir(buildDir);

    const nuxt = await loadNuxt({
		cwd: ctx.config.projectPath,
		dotenv: {
		  cwd: ctx.config.projectPath
		},
		defaultConfig: {
			modules: [
				[
					'@nhealth/fhir-profiling', {
						dir: ctx.config.profilingDir,
						outDir: `${buildDir}/fhir-profiling`,
						parallelProcessing: ctx.config.parallelProcessing
					}
				]
			],
		},
		overrides: {
		  logLevel: 'verbose',
		  buildDir: buildDir,
		  _generate: true,
		  	...{
				nitro: {
					static: true,
					output: {
						dir: `${ctx.config.outDir}/docs`,
					},
					prerender: {
						// Workaround for "Error: [404] Page not found: /manifest.json"
						failOnError: false,
					}
				}
			},
		},
	});

	await writeTypes(nuxt);

	nuxt.hook('build:error', (err) => {
		consola.error('Nuxt Build Error:', err)
		process.exit(1)
	});

	await buildNuxt(nuxt);
}