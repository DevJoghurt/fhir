import * as tar from 'tar';
import { Duplex } from 'node:stream';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default defineTask({
	meta: {
	  name: "profiling",
	  description: "Background task for FHIR profiling",
	},
	async run({ payload, context }) {
	  context.logMessage("Profiling has started");
	  if(payload?.packages && payload?.packages.length > 0){
		for(const packageItem of payload.packages){

			// add folder to tmp folder
			context.logMessage("TmpFolder" + tmpFolder);

			const packageItem = payload.packages[0];
			context.logMessage("PackageMeta" + JSON.stringify(payload.packages));
			const packageFile = packageItem.meta.files[0]

			context.logMessage("TmpFolder" + tmpFolder);
			const filenames = []
		}

	  } else {
		context.logMessage("No packages found");
	  }

	  return { result: "Success" };
	},
});