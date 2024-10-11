import { defineCommand } from 'citty'
import { resolve } from 'node:path'
import { readFSHFiles, createFhirResources } from '@nhealth/fhir-profiling/sushi'
import { sharedArgs } from './_shared'
import { consola } from 'consola'

export default defineCommand({
	meta: {
	  name: 'fhir:profile',
	  description: 'Create fhir profiles based on Fhir Shorthand',
	},
	args: {
	  ...sharedArgs,
	  cmd: {
		type: 'positional',
		required: true,
		description: 'Command to run ["create"]',
	  },
	  out: {
		type: 'string',
		description: 'Outdir for the profiles (default: export)',
	  },
	},
	async run(ctx) {
		const cwd = resolve(ctx.args.cwd || '.');
		const out = resolve(ctx.args.out || '.');

		if(ctx.args.cmd === 'create'){
			consola.info('Loading all fsh files from ', `${cwd}/profiles/fsh`);

			const fshFiles = await readFSHFiles({ rootDir: cwd });

			consola.info('Found ', fshFiles.length, ' files');

			if(fshFiles.length > 0){
				await createFhirResources(fshFiles, {
					rootDir: cwd,
					outDir: out,
					snapshot: true
				});
			}else{
				consola.error(`No FSH files found at "${cwd}/profiles/fsh"`);
			}
		}
		else{
			consola.error('Unknown command: ', ctx.args.cmd);
		}
	}
});