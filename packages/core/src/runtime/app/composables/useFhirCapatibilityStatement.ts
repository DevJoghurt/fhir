import { useFhirClient, useState } from '#imports'
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
 * Uses the FHIR server CapatibilityStatement to analyze the supported features of the FHIR server
 *
 * @returns ResourceHandler
 */
export async function useFhirCapatibilityStatement() {

	const resources: Ref<Record<ResourceType, InternalResourceSchema>> = useState('fhir:cs:resources', () => Object.create(null));
	const initialized = useState<boolean>('fhir:cs:resources:initialized',()=>false);

	const loadCapatibilityStatement = async (force: boolean = false) => {
		if (initialized.value && !force) {
			return;
		}
		// load the capatibility statement
		const { readCapabilityStatement } = useFhirClient()

		const { data: capabilityStatement } = await readCapabilityStatement()
		if (!capabilityStatement?.value) {
			return false;
		}
		const rest = capabilityStatement.value?.rest || []
		const restResources = rest[0].resource || []
		for (const resource of restResources) {
			resources.value[resource.type as ResourceType] = {
				name: resource.type as string,
				type: resource.profile as string,
				profile: {
					base: resource.profile as string,
					supported: [resource.profile || ''].concat(resource.supportedProfile || []),
					definitions: null
				}
			}
		}
		initialized.value = true;

		return true;
	}

	/**
	 * Get the resource schema
	 * @param resourceType
	 * @returns
	 */
	const getResources = () => {
		// return the cached resources as array
		return Object.values(resources.value);
	}

	/**
	 * Resolve the profile of a resource
	 * @param resource Resource
	 * @returns	url of the profile
	 *
	 */
	const resolveProfile = (resource: Resource) => {
		let profile = null;
		if(resource?.meta?.profile && resource.meta.profile.length > 0) {
			profile = resource.meta.profile[0];
		}
		else if (resource?.resourceType && resources.value[resource?.resourceType]) {
			profile = resources.value[resource.resourceType].profile.base;
		}
		if (!profile) {
			profile = 'http://hl7.org/fhir/StructureDefinition/' + resource?.resourceType;
		}
		return profile;
	}

	const loadProfiles = async (resourceType: ResourceType) => {
		const rs = resources.value[resourceType];
		// load cached profiles if available
		if (rs.profile.definitions) {
			return rs.profile.definitions;
		}
		// load profiles from server
		const { search } = useFhirClient()

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

		resources.value[resourceType].profile.definitions = profiles;

		return profiles;
	}

	await loadCapatibilityStatement();

	return {
		loadCapatibilityStatement,
		getResources,
		resolveProfile,
		loadProfiles
	};
}