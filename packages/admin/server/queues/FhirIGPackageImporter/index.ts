

export default defineQueueWorker({
	name: 'FhirIGPackageImporter',
}, async (job) => {
	job.log('Starting FhirIGPackageImporter')
	// Do some work
	const vals = await job.getChildrenValues()
	job.log(vals.toString())

	switch (job.name) {
		case 'load':
			job.log('Load Fhir packages')
			job.updateProgress(100)
			return {
				binaryResource: 'some binary resource'
			}
		case 'analyze':
			job.log('Analyze Fhir packages')
			job.updateProgress(100)
			return {
				analysis: 'some analysis'
			}
		case 'ingest':
			job.log('Ingest Fhir packages')
			job.updateProgress(100)
			return {
				ingestion: 'some ingestion'
			}
	}

	job.log('Finished FhirIGPackageImporter')
	job.updateProgress(100)
})