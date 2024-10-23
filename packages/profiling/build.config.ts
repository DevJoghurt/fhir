import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
	declaration: true,
	entries: [
	  	{
			input: 'src/module'
	 	},
		{
			input: 'src/sushi'
		},
		{
			input: 'src/markdown'
		},
		{
			builder: "mkdist",
			input: "src/types"
		}
	]
});