

export default defineQueueWorker({
	name: 'FhirIGPackageImporter',
}, async (job) => {
	job.log('Starting FhirIGPackageImporter')
	// Do some work
})