const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default defineTask({
	meta: {
	  name: "profiling",
	  description: "Background task for FHIR profiling",
	},
	async run({ payload, context }) {
	  context.logMessage("Profiling has started");
	  await wait(10000);
	  context.logMessage("Profiling has started 2");
	  await wait(10000);
	  context.logMessage("Profiling has started 3");
	  await wait(10000);
	  context.logMessage("Profiling has started 4");
	  await wait(10000);
	  context.logMessage("Profiling has started 5");
	  await wait(10000);
	  context.logMessage("Profiling has started 6");
	  if(payload?.job === 'init'){
		context.logMessage("Profiling has started init");
	  }
	  context.setStatus("completed");
	  context.logMessage("Profiling has completed");
	  return { result: "Success" };
	},
});