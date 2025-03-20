import { useFhir, useState } from '#imports'
import type { Ref } from '#imports'
import type { ResourceType, Resource } from '@medplum/fhirtypes'

export type Profile = {
	base: string;
	supported: string[];
	definitions: null | ProfileDefinition[];
}

export type ProfileDefinition = {
	name: string;
	description: string;
	publisher: string;
	url: string;
	status: 'draft' | 'active' | 'retired' | 'unknown' | undefined;
	base: boolean;
}

type InternalResourceSchema = {
	name: string;
	type: string;
	profile: Profile;
}


/**
 * ResourceHandler based on CapatibilityStatement and loaded StructureDefinitions of fhir server's resources
 *
 * @returns ResourceHandler
 */
export async function useResource() {
	const resourceHandler = new ResourceHandler();
	await resourceHandler.loadCapatibilityStatement();
	return resourceHandler;
}

class ResourceHandler {
	// use global state to cache the resources
	private readonly resources: Ref<Record<ResourceType, InternalResourceSchema>> = useState('fhir:resources', () => Object.create(null));
	private readonly initialized = useState<boolean>('fhir:resources:initialized',()=>false);

	constructor() {

	}

	async loadCapatibilityStatement(force: boolean = false) {
		if (this.initialized.value && !force) {
			return;
		}
		// load the capatibility statement
		const { readCapabilityStatement } = useFhir()

		const { data: capabilityStatement } = await readCapabilityStatement()
		if (!capabilityStatement?.value) {
			return false;
		}
		const rest = capabilityStatement.value?.rest || []
		const resources = rest[0].resource || []
		for (const resource of resources) {
			this.resources.value[resource.type as ResourceType] = {
				name: resource.type as string,
				type: resource.profile as string,
				profile: {
					base: resource.profile as string,
					supported: [resource.profile || ''].concat(resource.supportedProfile || []),
					definitions: null
				}
			}
		}
		this.initialized.value = true;
		return true;
	}

	/**
	 * Get the resource schema
	 * @param resourceType
	 * @returns
	 */
	getResources() {
		// return the cached resources as array
		return Object.values(this.resources.value);
	}

	/**
	 * Resolve the profile of a resource
	 * @param resource Resource
	 * @returns	url of the profile
	 *
	 */
	resolveProfile(resource: Resource) {
		let profile = null;
		if(resource?.meta?.profile && resource.meta.profile.length > 0) {
			profile = resource.meta.profile[0];
		}
		else if (resource?.resourceType && this.resources.value[resource?.resourceType]) {
			profile = this.resources.value[resource.resourceType].profile.base;
		}
		if (!profile) {
			profile = 'http://hl7.org/fhir/StructureDefinition/' + resource?.resourceType;
		}
		return profile;
	}

	async loadProfiles(resourceType: ResourceType) {
		const rs = this.resources.value[resourceType];
		// load cached profiles if available
		if (rs.profile.definitions) {
			return rs.profile.definitions;
		}
		// load profiles from server
		const { search } = useFhir()

		const {
			data
		} = await search('StructureDefinition', {
			url: rs.profile.supported.join(','),
			_elements: 'name,url,description,status,publisher'
		})

		const profiles = data.value.entry?.map((entry) => ({
			name: entry.resource?.name || '',
			description: entry.resource?.description || '',
			publisher: entry.resource?.publisher || '',
			url: entry.resource?.url || '',
			status: entry.resource?.status || 'unknown',
			base: rs.profile.base === entry.resource?.url || false
		})) || [];

		this.resources.value[resourceType].profile.definitions = profiles;

		return profiles;
	}

}