import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	declaration: true,
	entries: [
	  	{
			input: 'src/module'
	 	},
		{
			input: 'src/profiling'
		}
	]
});