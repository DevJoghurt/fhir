import { api } from 'dicomweb-client'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'

type DicomWebOptions = {
	serverUrl?: string;
	prefix?: string;
}

/**
 * Composable that provides DICOM Web functionality.
 * Query and retrieve DICOM data from a DICOM Web server.
 * Uses: Dicomweb Client https://github.com/dcmjs-org/dicomweb-client/
 */
export function useDicomWeb(options: DicomWebOptions = {}) {
	// Merge configuration options from multiple sources: local options, public runtime config, and private runtime config (only on server).
	const config = defu(
		options,
		useRuntimeConfig().public.fhir?.dicomweb || {}
	)

	const client = new api.DICOMwebClient({
		url: `${config.serverUrl}${config.prefix}`,
		singlepart: true,
	})

	//TODO: CORS issue
	const getStudies = async () => {
		let studies = []
		if(!import.meta.server) studies = await client.searchForStudies()
		return studies
	}

	return {
		getStudies
	}
}