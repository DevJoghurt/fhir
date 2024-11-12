import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { initializeProfilingContext, fishForFiles, buildProfiles, initializeWatcher } from '@nhealth/fhir-profiling'
import { sharedArgs } from './_shared'
import { consola } from 'consola'
import { buildDocs } from '../utils/build'
import { runDevDocs } from '../utils/dev'

const command = defineCommand({
	meta: {
	  name: 'fhir:profiling',
	  description: 'Create fhir profiles based on Fhir Shorthand',
	},
	args: {
	  ...sharedArgs,
	  action: {
		type: 'positional',
		required: true,
		description: 'Action to run ["build", "dev"]',
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
	  parallelProcessing: {
		type: 'string',
		description: 'Directory for parallel processing'
	  },
	  docs: {
		type: 'boolean',
		description: 'Generate documentation',
		default: false,
	  }
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || '.');

		let profilingCtx = await initializeProfilingContext({
			outDir: ctx.args.outDir,
			projectPath: cwd,
			profilingDir: ctx.args.dir,
			sushiConfig: true,
			snapshot: true,
			docs: {
				enabled: ctx.args.docs
			},
			parallelProcessing: {
				enabled: ctx.args.parallelProcessing ? true : false,
				dir: ctx.args.parallelProcessing || ''
			},
		});

		// if not generating docs, then we need to run the build process manually
		if(!ctx.args.docs){
			if(['dev', 'build'].indexOf(ctx.args.action) !== -1){
				consola.info('Loading all fsh files from ', `${cwd}/fsh`);

				profilingCtx = await fishForFiles(profilingCtx);

				await buildProfiles(profilingCtx);
			}

			if(ctx.args.action === 'dev'){
				consola.info('Watching for file changes in', `${cwd}/fsh`);
				initializeWatcher(profilingCtx);
				// Keep the process running
				setInterval(() => {}, 1 << 30);
			}
		}

		// if generating docs, then we need nuxt to run the build process
		if(ctx.args.docs){
			if(ctx.args.action === 'build'){
				consola.info('Running nuxt dev');
				await buildDocs(profilingCtx);
			}
			if(ctx.args.action === 'dev'){
				consola.info('Running nuxt dev');
				await runDevDocs(profilingCtx, ctx.args);
			}
		}
	}
});

export default command;