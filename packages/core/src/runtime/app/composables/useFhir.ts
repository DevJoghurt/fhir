import {
	useState,
	useFetch,
	useRuntimeConfig
} from '#imports'
import { defu } from 'defu'
import { concatUrls, encodeBase64, getQueryString, ContentType } from '../utils'
import type { QueryTypes } from '../utils'
import type {
	ExtractResource,
	ResourceType,
	OperationOutcome,
	Resource,
	Bundle
} from '@medplum/fhirtypes'
import consola from 'consola'
import type { UseFetchOptions, AsyncData } from '#app'


/**
 * JSONPatch patch operation.
 * Compatible with fast-json-patch and rfc6902 Operation.
 */
interface PatchOperation {
	readonly op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	readonly path: string;
	readonly value?: any;
}

type SessionState = {
	accessToken?: string
}

type FetchMethod = 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'GET'

type ExtendedFetchOptions = {
	/**
	 * Starts an async request following the FHIR "Asynchronous Request Pattern".
	 * See: https://hl7.org/fhir/r4/async.html
	 */
	asynchRequest?: boolean
}

type FetchOptions<T> = Omit<UseFetchOptions<T>, 'method' | 'body' | 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'> & ExtendedFetchOptions;

type InternalFetchOptions = UseFetchOptions<any> & ExtendedFetchOptions

type UseFhirOptions = {
	/**
	 * The FHIR server URL.
	 */
	serverUrl?: string;

	/**
	 * The FHIR base URL.
	 */
	baseUrl?: string;

	/**
	 * The FHIR server type.
	 */
	server?: 'medplum';

	/**
	 * Use credentials for the fetch request.
	 * If true, the request will ignore current session with access token.
	 * !!! Be careful with this option, because creadentials are private and normaly not client side available.
	 *
	 *  @default false
	 */
	useCredentials?: boolean;

	/**
	 *
	 */
	logLevel?: 'silent' | 'debug' | 'info' | 'warn' | 'error';
}

export function useFhir(options: UseFhirOptions = {
	useCredentials: false,
	logLevel: 'info'
}): {
	fhirUrl: (...path: string[]) => URL;
	fhirSearchUrl: (resourceType: ResourceType, query: QueryTypes) => URL;
	readResource: <K extends ResourceType>(resourceType: K, id: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any>;
	search: <K extends ResourceType>(resourceType: K, query?: FetchOptions<any>['query'], options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>>, any>;
	readHistory: <K extends ResourceType>(resourceType: K, id: string, options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>>, any>;
	readVersion: <K extends ResourceType>(resourceType: K, id: string, vid: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any>;
	readPatientEverything: (id: string, options?: FetchOptions<any>) => AsyncData<Bundle, any>;
	validateResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<OperationOutcome, any>;
	createResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<T, any>;
	createResourceIfNoneExist: <T extends Resource>(resource: T, query: string, options?: FetchOptions<any>) => AsyncData<T, any>;
	upsertResource: <T extends Resource>(resource: T, query: QueryTypes, options?: FetchOptions<any>) => AsyncData<T, any>;
	updateResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<T, any>;
	patchResource: <K extends ResourceType>(resourceType: K, id: string, operations: PatchOperation[], options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any>;
	deleteResource: (resourceType: ResourceType, id: string, options?: FetchOptions<any>) => AsyncData<any, any>;
	executeBatch: (bundle: Bundle, options?: FetchOptions<any>) => AsyncData<Bundle, any>;
} {

	// Merge configuration options from multiple sources: local options, public runtime config, and private runtime config (only on server).
	const config = defu(
		options,
		useRuntimeConfig().public?.fhir || {},
		import.meta.server ? useRuntimeConfig()?.fhir || {} : {}
	)

	const logLevelMapping = {
		silent: -999,
		debug: 3,
		info: 2,
		warn: 1,
		error: 0
	};

	// Set the log level, mapped to consola log levels
	consola.level = logLevelMapping[config?.logLevel || 'debug'] || 3;

	const fhirBaseUrl = concatUrls(config.serverUrl, config.basePath);

	const sessionState = useState<SessionState>('fhir-session', () => ({}))
	if(!sessionState.value?.accessToken ){
		consola.debug('No accessToken found in sessionState')
	}

	const accessToken = sessionState.value.accessToken || null

	/**
	 * Builds a FHIR URL from a collection of URL path components.
	 * For example, `fhirUrl('Patient', '123')` returns `fhir/R4/Patient/123`.
	 * @category HTTP
	 * @param path - The path component of the URL.
	 * @returns The well-formed FHIR URL.
	 */
	function fhirUrl(...path: string[]): URL {
		return new URL(concatUrls(fhirBaseUrl, path.join('/')));
	}

	/**
	 * Builds a FHIR search URL from a search query or structured query object.
	 * @category HTTP
	 * @category Search
	 * @param resourceType - The FHIR resource type.
	 * @param query - The FHIR search query or structured query object. Can be any valid input to the URLSearchParams() constructor.
	 * @returns The well-formed FHIR URL.
	 */
	function fhirSearchUrl(resourceType: ResourceType, query: QueryTypes): URL {
		const url = fhirUrl(resourceType);
		if (query) {
		  url.search = getQueryString(query);
		}
		return url;
	}

	const fetch = <T = any>(method: FetchMethod = 'GET', url: URL | string, fetchOptions?: InternalFetchOptions): AsyncData<T, any> => {
		url = url.toString()

		return useFetch<T>(url, {
			method: method as any,
			...fetchOptions,
			onRequest({ options }) {
				options.headers.set('Accept', 'application/fhir+json')
				// Set request header for async requests
				if(fetchOptions?.asynchRequest){
					options.headers.set('Prefer', 'respond-async')
				}
				// Set the request headers for authorization
				if(!config.useCredentials && accessToken){
					options.headers.set('Authorization', `Bearer ${accessToken}`)
				}
				else if(config.useCredentials && config.medplum?.clientId && config.medplum?.clientSecret){
					const basicAuth = encodeBase64(config.medplum.clientId + ':' + config.medplum.clientSecret)
					options.headers.set('Authorization', `Basic ${basicAuth}`)
				}
			},
			onRequestError(event) {
			  //TODO: Handle the request errors
			},
			onResponse({ response }) {
			  //TODO: Process the response data
			},
			onResponseError(event) {
			  // Handle the response errors
			  if(event.response.status === 401){
				// handle unauthorized requests
			  }
			},
		}) as AsyncData<T, any>
	}

	  /**
   * Sends a FHIR search request.
   *
   * @example
   * Example using a FHIR search string:
   *
   * ```typescript
   * const bundle = await client.search('Patient', 'name=Alice');
   * console.log(bundle);
   * ```
   *
   * @example
   * The return value is a FHIR bundle:
   *
   * ```json
   * {
   *    "resourceType": "Bundle",
   *    "type": "searchset",
   *    "entry": [
   *       {
   *          "resource": {
   *             "resourceType": "Patient",
   *             "name": [
   *                {
   *                   "given": [
   *                      "George"
   *                   ],
   *                   "family": "Washington"
   *                }
   *             ],
   *          }
   *       }
   *    ]
   * }
   * ```
   *
   * @example
   * To query the count of a search, use the summary feature like so:
   *
   * ```typescript
   * const patients = medplum.search('Patient', '_summary=count');
   * ```
   *
   * See FHIR search for full details: https://www.hl7.org/fhir/search.html
   * @category Search
   * @param resourceType - The FHIR resource type.
   * @param query - Optional FHIR search query or structured query object. Can be any valid input to the URLSearchParams() constructor.
   * @param options - Optional fetch options.
   * @returns Promise to the search result bundle.
   */
	const search = <K extends ResourceType>(
		resourceType: K,
		query?:  FetchOptions<any>['query'],
		options?: FetchOptions<any>
	  ) => {
		const url = fhirSearchUrl(resourceType, {});

		return fetch<Bundle<ExtractResource<K>>>('GET', url, {
			query: query,
			...options
		})
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
	 * @param id - The resource ID.
	 * @param options - Optional fetch options.
	 * @returns The resource if available.
	 */
	const readResource = <K extends ResourceType>(resourceType: K, id: string, options?: FetchOptions<any>): AsyncData<ExtractResource<K>, any> => {
		if (!id) {
			throw new Error('The "id" parameter cannot be null, undefined, or an empty string.');
		}

		return fetch<ExtractResource<K>>('GET', fhirUrl(resourceType, id), options)
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
	 * @param options - Optional fetch options.
	 * @returns The validate operation outcome.
	 */
	const validateResource = <T extends Resource>(
		resource: T,
		options?: FetchOptions<any>
	): AsyncData<OperationOutcome, any> => {
		return fetch<OperationOutcome>('POST', fhirUrl(resource.resourceType, '$validate'), {
			body: JSON.stringify(resource),
			...options
		})
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
	const readHistory = <K extends ResourceType>(
		resourceType: K,
		id: string,
		options?: FetchOptions<any>
	): AsyncData<Bundle<ExtractResource<K>>, any> => {
		return fetch<Bundle<ExtractResource<K>>>('GET', fhirUrl(resourceType, id, '_history'), options)
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
	 * @param options - Optional fetch options.
	 * @returns The resource if available.
	 */
	const readVersion = <K extends ResourceType>(
		resourceType: K,
		id: string,
		vid: string,
		options?: FetchOptions<any>
	) => {
		return fetch<ExtractResource<K>>('GET', fhirUrl(resourceType, id, '_history', vid), options)
	}

	/**
	 * Executes the Patient "everything" operation for a patient.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const bundle = await readPatientEverything('123');
	 * console.log(bundle);
	 * ```
	 *
	 * See the FHIR "patient-everything" operation for full details: https://hl7.org/fhir/operation-patient-everything.html
	 * @category Read
	 * @param id - The Patient Id
	 * @param options - Optional fetch options.
	 * @returns A Bundle of all Resources related to the Patient
	 */
	const readPatientEverything = (id: string, options?: FetchOptions<any>) => {
		return fetch<Bundle>('GET', fhirUrl('Patient', id, '$everything'), options)
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
	 * @param options - Optional fetch options.
	 * @returns The result of the create operation.
	 */
	const createResource = <T extends Resource>(resource: T, options?: FetchOptions<any>) => {
		if (!resource.resourceType) {
		  throw new Error('Missing resourceType');
		}
		return fetch<T>('POST', fhirUrl(resource.resourceType), {
		  body: JSON.stringify(resource),
		  ...options
		})
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
	 * @param options - Optional fetch options.
	 * @returns The result of the create operation.
	 */
	const createResourceIfNoneExist = <T extends Resource>(
		resource: T,
		query: string,
		options?: FetchOptions<any>
	): AsyncData<T, any> => {
		options = defu(options, { headers: { 'If-None-Exist': query } })
		return fetch<T>('POST', fhirUrl(resource.resourceType), {
			body: JSON.stringify(resource),
			...options
		})
	}

	/**
	 * Upsert a resource: update it in place if it exists, otherwise create it.  This is done in a single, transactional
	 * request to guarantee data consistency.
	 * @param resource - The resource to update or create.
	 * @param query - A FHIR search query to uniquely identify the resource if it already exists.
	 * @param options  - Optional fetch options.
	 * @returns The updated/created resource.
	 */
	const upsertResource = <T extends Resource>(
		resource: T,
		query: QueryTypes,
		options?: FetchOptions<any>
	): AsyncData<T, any> => {
		// Build conditional update URL, e.g. `PUT /ResourceType?search-param=value`
		const url = fhirSearchUrl(resource.resourceType, query);

		return fetch<T>('PUT', url, {
			body: JSON.stringify(resource),
			...options
		})
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
	const updateResource = <T extends Resource>(
		resource: T,
		options?: FetchOptions<any>
	): AsyncData<T, any> => {
		if (!resource.resourceType) {
		  throw new Error('Missing resourceType');
		}
		if (!resource.id) {
		  throw new Error('Missing id');
		}

		return fetch<T>('PUT', fhirUrl(resource.resourceType, resource.id), {
			body: JSON.stringify(resource),
			...options
		})
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
	const patchResource = <K extends ResourceType>(
		resourceType: K,
		id: string,
		operations: PatchOperation[],
		options?: FetchOptions<any>
	): AsyncData<ExtractResource<K>, any> => {
		options = defu(options, {
			headers: { 'Content-Type': ContentType.JSON_PATCH }
		})
		return fetch<ExtractResource<K>>('PATCH', fhirUrl(resourceType, id), {
			body: JSON.stringify(operations),
			...options
		})
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
	const deleteResource = (resourceType: ResourceType, id: string, options?: FetchOptions<any>) => {
		return fetch('DELETE', fhirUrl(resourceType, id), options)
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
	const executeBatch = (
		bundle: Bundle,
		options?: FetchOptions<any>
	): AsyncData<Bundle, any> => {
		return fetch<Bundle>('POST', fhirBaseUrl, {
			body: JSON.stringify(bundle),
			...options
		})
	}

	return {
		fhirUrl,
		fhirSearchUrl,
		readResource,
		search,
		readHistory,
		readVersion,
		readPatientEverything,
		validateResource,
		createResource,
		createResourceIfNoneExist,
		upsertResource,
		updateResource,
		patchResource,
		deleteResource,
		executeBatch
	}
}