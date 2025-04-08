import { useFhirClient } from '#imports';
import type { Resource } from '@medplum/fhirtypes'

export async function loadFhirProfileIntoServer(resource: Resource) {
	const { createResourceIfNoneExist, patchResource, readStructureDefinition } = useFhirClient();

	// check if resource is StructureDefinition and has a snapshot
	let needsToCreateSnapshot = resource.resourceType === 'StructureDefinition' && typeof resource?.snapshot === 'undefined';

	// Load the package into the server
	// use url / name as the key to check if the resource already exists
	// TODO: implement a version check to make updating resources easier
	let query = `url=${resource?.url || ''}`;
	// in R4 NamingSystem has no url, so we use name as the key
	if(resource.resourceType === 'NamingSystem'){
		query = `name=${encodeURIComponent(resource?.name || '')}`;

	}
	const resp = await createResourceIfNoneExist(resource, query);
	if(!needsToCreateSnapshot){
		return resp;
	}
	if(resp.id === undefined){
		throw new Error('Failed to create resource');
	}
	// create a snapshot if it does not exist and patch the resource
	const sd = await readStructureDefinition(resp.id,'$snapshot');
	if(sd.snapshot){
		const patchedResp = await patchResource('StructureDefinition', resp.id, [{
			op: 'add',
			path: '/snapshot',
			value: sd.snapshot
		}]);
		return patchedResp;
	}
	throw new Error('Failed to load snapshot');
}