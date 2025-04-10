const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default defineTask({
	meta: {
	  name: "profiling",
	  description: "Background task for FHIR profiling",
	},
	async run({ payload, context }) {
	  console.log("Init profiling ...", payload);
	  await wait(10000);
	  console.log("Init profiling 2 ...");
	  await wait(10000);
	  console.log("Init profiling 3 ...");
	  if(payload?.job === 'init'){
		console.log("Init profiling 4 ...");

	  }
	  return { result: "Success" };
	},
});