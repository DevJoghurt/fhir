import { join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { useRuntimeConfig, defineEventHandler, getRouterParam } from '#imports'

export default defineEventHandler(async (event) => {
	const fileName = getRouterParam(event, 'resourceType') || '';

    const { resourcesDir } = useRuntimeConfig().fhirProfiling;
    let resourcesPath = join(resourcesDir, fileName);

	let fileContent = '';
	// check if file exists
	if (existsSync(resourcesPath)) {
		fileContent = readFileSync(resourcesPath, 'utf8');
	} else {
		throw new Error(`Resource ${fileName} not found`);
	}

	return JSON.parse(fileContent);
})