import { defu } from 'defu'
import { useRuntimeConfig, useState, reactive, toRefs } from '#imports'
import { concatUrls, ContentType } from '../../utils'
import type {
	ExtractResource,
	ResourceType,
	CapabilityStatement,
	OperationOutcome,
	Resource,
	Bundle,
	ValueSet
} from '@medplum/fhirtypes'

type SessionState = {
	accessToken?: string
}

type UseFhirClientOptions = {
	/**
	 * The FHIR server type.
	 */
	server?: 'hapi' | 'medplum';

	/**
	 * The FHIR server URL.
	 */
	serverUrl?: string;

	/**
	 * The FHIR base URL.
	 */
	baseUrl?: string;

	/**
	 * Access token for the fetch request.
	 */
	accessToken?: string;

	/**
	 * Use credentials for the fetch request.
	 * If true, the request will ignore current session with access token.
	 * !!! Be careful with this option, because credentials are private and normaly not client side available.
	 *
	 *  @default false
	 */
	useCredentials?: boolean;

	/**
	 *
	 */
	logLevel?: 'silent' | 'debug' | 'info' | 'warn' | 'error';
}

type RequestOptions = {
	/**
	 * The HTTP method to use for the request.
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

	/**
	 * The headers to include in the request.
	 */
	headers?: HeadersInit;

	/**
	 * The body of the request.
	 */
	body?: BodyInit | null;

	/**
	 * The query parameters to include in the request.
	 * These will be serialized into a query string and appended to the URL.
	 */
	query?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * ValueSet $expand operation parameters.
 * See: https://hl7.org/fhir/r4/valueset-operation-expand.html
 */
export interface ValueSetExpandParams {
	url?: string;
	filter?: string;
	date?: string;
	offset?: number;
	count?: number;
}

/**
 * JSONPatch patch operation.
 * Compatible with fast-json-patch and rfc6902 Operation.
 */
export interface PatchOperation {
	readonly op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	readonly path: string;
	readonly value?: any;
}


export function useFhirClient(options: UseFhirClientOptions = {
	useCredentials: false,
	logLevel: 'info'
}) {

		// Merge configuration options from multiple sources: local options, public runtime config, and private runtime config (only on server).
	const config = defu(
		options,
		import.meta.server ? useRuntimeConfig()?.fhir || {} : {},
		useRuntimeConfig().public?.fhir || {}
	)

	const sessionState = useState<SessionState>('fhir-session', () => ({}))

	const accessToken = sessionState.value.accessToken || null

	const fhirBaseUrl = concatUrls(config.serverUrl, config.basePath || '');

	const state = reactive({
		loading: false,
		error: null,
	})

	/**
	 * Builds a FHIR URL from a collection of URL path components.
	 * For example, `fhirUrl('Patient', '123')` returns `fhir/R4/Patient/123`.
	 * @category HTTP
	 * @param path - The path component of the URL.
	 * @returns The well-formed FHIR URL.
	 */
	const fhirUrl = (...path: string[]): URL => {
		return new URL(concatUrls(fhirBaseUrl, path.join('/')));
	}

	const fetchInternal = async <T>(url: URL, options: RequestOptions): Promise<T> => {
		const headers: HeadersInit = {
			'Content-Type': 'application/fhir+json',
			'Accept': 'application/fhir+json'
		}

		if (accessToken && !config.useCredentials) {
			headers['Authorization'] = `Bearer ${accessToken}`
		}

		return $fetch<T>(url.toString(), {
			method: options.method || 'GET',
			headers: options.headers,
			body: options.body,
			query: options.query
		})
	}


	/**
	 * Reads a CapabilityStatement of the server.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const capabilityStatement = await readCapabilityStatement();
	 * console.log(capabilityStatement);
	 * ```
	 *
	 * See the FHIR "CapabilityStatement"  for full details: https://hl7.org/fhir/R4/capabilitystatement.html
	 * @category Read
	 * @param options - Optional fetch options.
	 * @returns The resource if available.
	 */
	const readCapabilityStatement = (): Promise<CapabilityStatement> => {
		return fetchInternal<CapabilityStatement>(fhirUrl('metadata'), {
			method: 'GET'
		});
	}

	/**
	 * Searches for resources of a specific search query
	 * * @example
	 * Example:
	 * ```typescript
	 * const patients = await search('Patient', { name: 'Smith' });
	 * console.log(patients);
	 * ```
	 *
	 * * See the FHIR "Search" for full details: https://hl7.org/fhir/R4/search.html
	 * * @category Search
	 * * @param resourceType - The type of resource to search for, e.g. 'Patient', 'Observation'.
	 * * @param query - Optional query parameters to filter the search results.
	 * * @returns A Promise that resolves to a Bundle of resources matching the search criteria.
	 *
	 */
	const search = <K extends ResourceType>(resourceType: K, query?: RequestOptions['query']): Promise<Bundle<ExtractResource<K>>> => {
		return fetchInternal<Bundle<ExtractResource<K>>>(fhirUrl(resourceType), {
			method: 'GET',
			query
		});
	}

	/**
	 * Reads a resource by resource type and ID.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const patient = await readResource('Patient', '123');
	 * console.log(patient);
	 * ```
	 *
	 * See the FHIR "read" operation for full details: https://www.hl7.org/fhir/http.html#read
	 * @category Read
	 * @param resourceType - The FHIR resource type.
	 * @param id - path params e.g. resource ID or history ID.
	 * @returns The resource if available.
	 */
	const readResource = <K extends ResourceType>(resourceType: K, id: string): Promise<ExtractResource<K>> => {
		return fetchInternal<ExtractResource<K>>(fhirUrl(resourceType, id), {
			method: 'GET',
		});
	}

	/**
	 * Reads resource history by resource type and ID.
	 *
	 * The return value is a bundle of all versions of the resource.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const history = await readHistory('Patient', '123');
	 * console.log(history);
	 * ```
	 *
	 * See the FHIR "history" operation for full details: https://www.hl7.org/fhir/http.html#history
	 * @category Read
	 * @param resourceType - The FHIR resource type.
	 * @param id - The resource ID.
	 * @param options - Optional fetch options.
	 * @returns Promise to the resource history.
	 */
	const readHistory = <K extends ResourceType>(resourceType?: K | null, id?: string | null, options?: {
		query?: RequestOptions['query'];
	}): Promise<Bundle<ExtractResource<K>>> => {
		let url = fhirUrl('_history');
		if (resourceType && id) {
			url = fhirUrl(resourceType, id, '_history');
		}
		return fetchInternal<Bundle<ExtractResource<K>>>(url, {
			method: 'GET',
			query: options?.query
		});
	}

	/**
	 * Reads a specific version of a resource by resource type, ID, and version ID.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const version = await readVersion('Patient', '123', '456');
	 * console.log(version);
	 * ```
	 *
	 * See the FHIR "vread" operation for full details: https://www.hl7.org/fhir/http.html#vread
	 * @category Read
	 * @param resourceType - The FHIR resource type.
	 * @param id - The resource ID.
	 * @param vid - The version ID.
	 * @returns The resource if available.
	 */
	const readVersion = <K extends ResourceType>(resourceType: K, id: string, vid: string): Promise<ExtractResource<K>> => {
		return fetchInternal<ExtractResource<K>>(fhirUrl(resourceType, id, '_history', vid), {
			method: 'GET'
		});
	}

	/**
	 * Executes the validate operation with the provided resource.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const result = await validateResource({
	 *   resourceType: 'Patient',
	 *   name: [{ given: ['Alice'], family: 'Smith' }],
	 * });
	 * ```
	 *
	 * See the FHIR "$validate" operation for full details: https://www.hl7.org/fhir/resource-operation-validate.html
	 * @param resource - The FHIR resource.
	 * @returns The validate operation outcome.
	 */
	const validateResource = <T extends Resource>(resource: T): Promise<OperationOutcome> => {
		return fetchInternal<OperationOutcome>(fhirUrl(resource.resourceType, '$validate'), {
			method: 'POST',
			body: JSON.stringify(resource)
		});
	}

	/**
	 * Creates a new FHIR resource.
	 *
	 * The return value is the newly created resource, including the ID and meta.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const result = await createResource({
	 *   resourceType: 'Patient',
	 *   name: [{
	 *    family: 'Smith',
	 *    given: ['John']
	 *   }]
	 * });
	 * console.log(result.id);
	 * ```
	 *
	 * See the FHIR "create" operation for full details: https://www.hl7.org/fhir/http.html#create
	 * @category Create
	 * @param resource - The FHIR resource to create.
	 * @returns The result of the create operation.
	 */
	const createResource = <T extends Resource>(resource: T): Promise<T> => {
		if (!resource.resourceType) {
			throw new Error('Missing resourceType');
		}
		return fetchInternal<T>(fhirUrl(resource.resourceType), {
			method: 'POST',
			body: JSON.stringify(resource)
		});
	}

	/**
	 * Conditionally create a new FHIR resource only if some equivalent resource does not already exist on the server.
	 *
	 * The return value is the existing resource or the newly created resource, including the ID and meta.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const result = await createResourceIfNoneExist(
	 *   {
	 *     resourceType: 'Patient',
	 *     identifier: [{
	 *      system: 'http://example.com/mrn',
	 *      value: '123'
	 *     }]
	 *     name: [{
	 *      family: 'Smith',
	 *      given: ['John']
	 *     }]
	 *   },
	 *   'identifier=123'
	 * );
	 * console.log(result.id);
	 * ```
	 *
	 * This method is syntactic sugar for:
	 *
	 * ```typescript
	 * return searchOne(resourceType, query) ?? createResource(resource);
	 * ```
	 *
	 * The query parameter only contains the search parameters (what would be in the URL following the "?").
	 *
	 * See the FHIR "conditional create" operation for full details: https://www.hl7.org/fhir/http.html#ccreate
	 * @category Create
	 * @param resource - The FHIR resource to create.
	 * @param query - The search query for an equivalent resource (should not include resource type or "?").
	 * @returns The result of the create operation.
	 */

	const createResourceIfNoneExist = <T extends Resource>(resource: T, query: string): Promise<T> => {
		const options = {
			headers: {
				'If-None-Exist': query
			}
		};
		return fetchInternal<T>(fhirUrl(resource.resourceType), {
			method: 'POST',
			body: JSON.stringify(resource),
			...options
		});
	}

	/**
	 * Searches a ValueSet resource using the "expand" operation.
	 * See: https://www.hl7.org/fhir/operation-valueset-expand.html
	 * @category Search
	 * @param params - The ValueSet expand parameters.
	 * @param options - Optional fetch options.
	 * @returns Promise to expanded ValueSet.
	 */
	const valueSetExpand = (params: ValueSetExpandParams): Promise<ValueSet> => {
		const url = fhirUrl('ValueSet', '$expand');
		url.search = new URLSearchParams(params as Record<string, string>).toString();
		return fetchInternal<ValueSet>(url, {
			method: 'GET'
		});
	}

	const postResource = <K extends ResourceType>(resourceType: K, id?: string | null, body: any = {}, operation?: any): Promise<any> => {
		const params =  [ resourceType ] as string[];
		if (id) {
			params.push(id);
		}
		if (operation) {
			params.push(operation);
		}
		const url = fhirUrl(...params);
		return fetchInternal<any>(url, {
			method: 'POST',
			body: JSON.stringify(body || {})
		});
	}


	/**
	 * Upsert a resource: update it in place if it exists, otherwise create it.  This is done in a single, transactional
	 * request to guarantee data consistency.
	 * @param resource - The resource to update or create.
	 * @param query - A FHIR search query to uniquely identify the resource if it already exists.
	 * @param options  - Optional fetch options.
	 * @returns The updated/created resource.
	 */
	const upsertResource = <T extends Resource>(resource: T, query?: RequestOptions['query'], options?: {
		clientIdStrategy?: boolean;
		forceOnMissingId?: boolean;
	}): Promise<T> => {
		// remove clientIdStrategy from options if it exists
		const {
			clientIdStrategy,
			forceOnMissingId = false
		} = options || {};

		const path = [resource.resourceType] as string[];
		if(clientIdStrategy && resource?.id){
			// add clientIdStrategy to the paths
			path.push(resource.id)
		}
		const url = fhirUrl(...path);
		let method: RequestOptions['method'] = 'PUT';
		if(!resource?.id && forceOnMissingId === true){
			// if the resource does not have an id, use POST method -> otherwise it will fail
			method = 'POST';
		}
		return fetchInternal<T>(url, {
			method,
			body: JSON.stringify(resource),
			query
		});
	}
	/**
	 * Updates a FHIR resource.
	 *
	 * The return value is the updated resource, including the ID and meta.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const result = await updateResource({
	 *   resourceType: 'Patient',
	 *   id: '123',
	 *   name: [{
	 *    family: 'Smith',
	 *    given: ['John']
	 *   }]
	 * });
	 * console.log(result.meta.versionId);
	 * ```
	 *
	 * See the FHIR "update" operation for full details: https://www.hl7.org/fhir/http.html#update
	 * @category Write
	 * @param resource - The FHIR resource to update.
	 * @param options - Optional fetch options.
	 * @returns The result of the update operation.
	 */
	const updateResource = <T extends Resource>(resource: T): Promise<T> => {
		if (!resource?.resourceType) {
			throw new Error('Missing resourceType');
		}
		if (!resource?.id) {
			throw new Error('Missing id');
		}
		return fetchInternal<T>(fhirUrl(resource.resourceType, resource.id), {
			method: 'PUT',
			body: JSON.stringify(resource)
		});
	}

	/**
	 * Updates a FHIR resource using JSONPatch operations.
	 *
	 * The return value is the updated resource, including the ID and meta.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const result = await medplum.patchResource('Patient', '123', [
	 *   {op: 'replace', path: '/name/0/family', value: 'Smith'},
	 * ]);
	 * console.log(result.meta.versionId);
	 * ```
	 *
	 * See the FHIR "update" operation for full details: https://www.hl7.org/fhir/http.html#patch
	 *
	 * See the JSONPatch specification for full details: https://tools.ietf.org/html/rfc6902
	 * @category Write
	 * @param resourceType - The FHIR resource type.
	 * @param id - The resource ID.
	 * @param operations - The JSONPatch operations.
	 * @param options - Optional fetch options.
	 * @returns The result of the patch operations.
	 */
	const patchResource = <K extends ResourceType>(resourceType: K, id: string, operations: PatchOperation[]): Promise<ExtractResource<K>> => {
		options = defu(options, {
			headers: { 'Content-Type': ContentType.JSON_PATCH }
		});
		return fetchInternal<ExtractResource<K>>(fhirUrl(resourceType, id), {
			method: 'PATCH',
			body: JSON.stringify(operations)
		});
	}

	/**
	 * Deletes a FHIR resource by resource type and ID.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * await deleteResource('Patient', '123');
	 * ```
	 *
	 * See the FHIR "delete" operation for full details: https://www.hl7.org/fhir/http.html#delete
	 * @category Delete
	 * @param resourceType - The FHIR resource type.
	 * @param id - The resource ID.
	 * @param options - Optional fetch options.
	 * @returns The result of the delete operation.
	 */
	const deleteResource = (resourceType: ResourceType, id: string): Promise<any> => {
		return fetchInternal<any>(fhirUrl(resourceType, id), {
			method: 'DELETE'
		})
	}

	/**
	 * Executes a batch or transaction of FHIR operations.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * await executeBatch({
	 *   "resourceType": "Bundle",
	 *   "type": "transaction",
	 *   "entry": [
	 *     {
	 *       "fullUrl": "urn:uuid:61ebe359-bfdc-4613-8bf2-c5e300945f0a",
	 *       "resource": {
	 *         "resourceType": "Patient",
	 *         "name": [{ "use": "official", "given": ["Alice"], "family": "Smith" }],
	 *         "gender": "female",
	 *         "birthDate": "1974-12-25"
	 *       },
	 *       "request": {
	 *         "method": "POST",
	 *         "url": "Patient"
	 *       }
	 *     },
	 *     {
	 *       "fullUrl": "urn:uuid:88f151c0-a954-468a-88bd-5ae15c08e059",
	 *       "resource": {
	 *         "resourceType": "Patient",
	 *         "identifier": [{ "system": "http:/example.org/fhir/ids", "value": "234234" }],
	 *         "name": [{ "use": "official", "given": ["Bob"], "family": "Jones" }],
	 *         "gender": "male",
	 *         "birthDate": "1974-12-25"
	 *       },
	 *       "request": {
	 *         "method": "POST",
	 *         "url": "Patient",
	 *         "ifNoneExist": "identifier=http:/example.org/fhir/ids|234234"
	 *       }
	 *     }
	 *   ]
	 * });
	 * ```
	 *
	 * See The FHIR "batch/transaction" section for full details: https://hl7.org/fhir/http.html#transaction
	 * @category Batch
	 * @param bundle - The FHIR batch/transaction bundle.
	 * @param options - Optional fetch options.
	 * @returns The FHIR batch/transaction response bundle.
	 */
	const executeBatch = (bundle: Bundle): Promise<Bundle> => {
		return fetchInternal<Bundle>(fhirUrl(), {
			method: 'POST',
			body: JSON.stringify(bundle)
		});
	}


	return {
		...toRefs(state),
		readCapabilityStatement,
		search,
		readResource,
		readHistory,
		readVersion,
		validateResource,
		createResource,
		createResourceIfNoneExist,
		valueSetExpand,
		postResource,
		upsertResource,
		patchResource,
		updateResource,
		deleteResource,
		executeBatch
	}
}