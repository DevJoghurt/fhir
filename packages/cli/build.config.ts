import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	declaration: true,
	entries: [
	  	{
			input: 'src/index'
	 	},
	],
	rollup: {
		inlineDependencies: true,
		resolve: {
		  exportConditions: ['production', 'node'] as any,
		},
	},
	externals: [
		'fsevents',
		'node:url',
		'node:buffer',
		'node:path',
		'node:child_process',
		'node:process',
		'node:path',
		'node:os',
		'fsh-sushi'
	],
});