import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { initializeProfilingContext, fishForFiles, buildProfiles, initializeWatcher } from '@nhealth/fhir-profiling/sushi'
import { sharedArgs } from './_shared'
import { consola } from 'consola'
import { buildDocs } from '../utils/build'

export default defineCommand({
	meta: {
	  name: 'fhir:profiling',
	  description: 'Create fhir profiles based on Fhir Shorthand',
	},
	args: {
	  ...sharedArgs,
	  action: {
		type: 'positional',
		required: true,
		description: 'Action to run ["build"]',
	  },
	  dir: {
		type: 'string',
		description: 'Directory to load the FSH files from (default: profiling)',
		default: 'profiling',
	  },
	  outDir: {
		type: 'string',
		description: 'Outdir for the profiles (default: export)',
		default: 'export',
	  },
	  docs: {
		type: 'boolean',
		description: 'Generate documentation',
		default: false,
	  }
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || '.');

		let profilingCtx = initializeProfilingContext({
			outDir: ctx.args.outDir,
			projectPath: cwd,
			profilingDir: ctx.args.dir,
			snapshot: true,
			documentation: {
				enabled: ctx.args.docs
			}
		});

		// if not generating docs, then we need to run the build process manually
		if(!ctx.args.docs){
			if(['watch', 'build'].indexOf(ctx.args.action) !== -1){
				consola.info('Loading all fsh files from ', `${cwd}/fsh`);

				profilingCtx = await fishForFiles(profilingCtx);

				await buildProfiles(profilingCtx);
			}

			if(ctx.args.action === 'watch'){
				consola.info('Watching for file changes in', `${cwd}/fsh`);
				initializeWatcher(profilingCtx);
				// Keep the process running
				setInterval(() => {}, 1 << 30);
			}
		}

		// if generating docs, then we need nuxt to run the build process
		if(ctx.args.docs){
			await buildDocs(profilingCtx);
		}
	}
});