/*
* Universal Fhir Client Implementation
* Credits medplum: https://github.com/medplum/medplum/blob/main/packages/core/src/client.ts
*/
import { defu } from 'defu'
import { concatUrls, getQueryString, ContentType } from '../utils'
import type { QueryTypes } from '../utils'
import type {
	ExtractResource,
	ResourceType,
	CapabilityStatement,
	OperationOutcome,
	Resource,
	Bundle,
	ValueSet
} from '@medplum/fhirtypes'
import { consola } from 'consola'
import type { FetchOptions as OfetchOptions } from 'ofetch';
import { randomUUID } from "uncrypto";
import type { UseFetchOptions, AsyncData } from '#app'


/**
 * JSONPatch patch operation.
 * Compatible with fast-json-patch and rfc6902 Operation.
 */
export interface PatchOperation {
	readonly op: 'add' | 'remove' | 'replace' | 'copy' | 'move' | 'test';
	readonly path: string;
	readonly value?: any;
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

export type FetchMethod = 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'GET'

export type ExtendedFetchOptions = {
	/**
	 * Starts an async request following the FHIR "Asynchronous Request Pattern".
	 * See: https://hl7.org/fhir/r4/async.html
	 */
	asynchRequest?: boolean

	/**
	 * If clientIdStrategy is true, the client will use the clientIdStrategy to determine the client ID.
	 * This is used for upsert  operation, it adds the client id to the url
	 */
	clientIdStrategy?: boolean

	/**
	 * This is used for upsert  operation, it uses a POST method if the resource does not have an id.
	 */
	forceOnMissingId?: boolean
}

type SharedFetchOptions<T> =  UseFetchOptions<T> | OfetchOptions

export type FetchOptions<T> = Omit<SharedFetchOptions<T>, 'method' | 'body' | 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'> & ExtendedFetchOptions;

export type InternalFetchOptions = SharedFetchOptions<any> & ExtendedFetchOptions

type FhirCLientOptions = {
	/**
	 * The FHIR server type.
	 */
	server: 'hapi' | 'medplum';

	/**
	 * The FHIR server URL.
	 */
	serverUrl: string;

	/**
	 * The FHIR base URL.
	 */
	baseUrl: string;

	/**
	 *
	 */
	logLevel: 'silent' | 'debug' | 'info' | 'warn' | 'error';
}

export class FhirClient {
	private readonly fhirBaseUrl: string;
	private readonly fetch: <T = any>(method: FetchMethod, url: URL | string, fetchOptions?: InternalFetchOptions) => AsyncData<T, any> | Promise<T>;

	constructor(config: FhirCLientOptions, fetch: <T = any>(method: FetchMethod, url: URL | string, fetchOptions?: InternalFetchOptions) => AsyncData<T, any> | Promise<T>) {
		this.fhirBaseUrl = concatUrls(config.serverUrl, config.baseUrl);
		this.fetch = fetch;

		const logLevelMapping = {
			silent: -999,
			debug: 3,
			info: 2,
			warn: 1,
			error: 0
		};
		consola.level = logLevelMapping[config?.logLevel || 'debug'] || 3;
	}

	/**
	 * Builds a FHIR URL from a collection of URL path components.
	 * For example, `fhirUrl('Patient', '123')` returns `fhir/R4/Patient/123`.
	 * @category HTTP
	 * @param path - The path component of the URL.
	 * @returns The well-formed FHIR URL.
	 */
	fhirUrl(...path: string[]): URL {
		return new URL(concatUrls(this.fhirBaseUrl, path.join('/')));
	}

	/**
	 * Builds a FHIR search URL from a search query or structured query object.
	 * @category HTTP
	 * @category Search
	 * @param resourceType - The FHIR resource type.
	 * @param query - The FHIR search query or structured query object. Can be any valid input to the URLSearchParams() constructor.
	 * @returns The well-formed FHIR URL.
	 */
	fhirSearchUrl(resourceType: ResourceType, query: QueryTypes): URL {
		const url = this.fhirUrl(resourceType);
		if (query) {
			url.search = getQueryString(query);
		}
		return url;
	}

	createUUID(): string {
		return `urn:uuid:${randomUUID()}`;
	}

	private fetchInternal<T = any>(method: FetchMethod, url: URL | string, fetchOptions?: InternalFetchOptions): AsyncData<T, any> | Promise<T> {
		url = url.toString();

		return this.fetch<T>(method, url, {
			...fetchOptions
		}) as AsyncData<T, any> | Promise<T>;
	}

	search<K extends ResourceType>(resourceType: K, query?: FetchOptions<any>['query'], options?: FetchOptions<any>): AsyncData<Bundle<ExtractResource<K>>, any> | Promise<Bundle<ExtractResource<K>>> {
		const url = this.fhirSearchUrl(resourceType, {});
		return this.fetchInternal<Bundle<ExtractResource<K>>>('GET', url, { query, ...options });
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
	 * @param params - path params e.g. resource ID or history ID.
	 * @param options - Optional fetch options.
	 * @returns The resource if available.
	 */
	readResource<K extends ResourceType>(resourceType: K, params: string | string[], options?: FetchOptions<any>): AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>> {
		if (!params) {
			throw new Error('The "params" parameter cannot be null, undefined, or an empty string.');
		}
		const uri = [resourceType] as string[];
		if (Array.isArray(params)) {
			uri.push(...params);
		} else {
			uri.push(params);
		}
		return this.fetchInternal<ExtractResource<K>>('GET', this.fhirUrl(...uri), options);
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
	validateResource<T extends Resource>(resource: T, options?: FetchOptions<any>): AsyncData<OperationOutcome, any> | Promise<OperationOutcome> {
		return this.fetchInternal<OperationOutcome>('POST', this.fhirUrl(resource.resourceType, '$validate'), {
			body: JSON.stringify(resource),
			...options
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
	readHistory<K extends ResourceType>(resourceType?: K | null, id?: string | null, options?: FetchOptions<any>): AsyncData<Bundle<ExtractResource<K>> | Bundle, any> | Promise<Bundle<ExtractResource<K>> | Bundle> {
		let url = this.fhirUrl('_history');
		if (resourceType && id) {
			url = this.fhirUrl(resourceType, id, '_history');
		}
		return this.fetchInternal<Bundle<ExtractResource<K>> | Bundle>('GET', url, options);
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
	readVersion<K extends ResourceType>(resourceType: K, id: string, vid: string, options?: FetchOptions<any>): AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>> {
		return this.fetchInternal<ExtractResource<K>>('GET', this.fhirUrl(resourceType, id, '_history', vid), options);
	}

	/**
	 * Reads the StructureDefinition of a resource.
	 *
	 * @example
	 * Example:
	 *
	 * ```typescript
	 * const structureDefinition = await readStructureDefinition('http://hl7.org/fhir/R4/Patient', '$snapshot');
	 * console.log(readStructureDefinition);
	 * ```
	 *
	 * See the FHIR "StructureDefinition" resource for full details: https://hl7.org/fhir/R4/structuredefinition.html
	 * @category Read
	 * @param idOrUrl - An id or url of the StructureDefinition.
	 * @param operation - The operation e.g. $snapshot.
	 * @param options - Optional fetch options.
	 * @returns The resource if available.
	 */
	readStructureDefinition(idOrUrl: string, operation?: '$snapshot' | '$meta', options?: FetchOptions<any>): AsyncData<Bundle<ExtractResource<'StructureDefinition'>>, any> | Promise<Bundle<ExtractResource<'StructureDefinition'>>> {
		//check if the idOrUrl is a URL
		const isUrl = idOrUrl.includes('http');

		const fhirUrl = isUrl ? this.fhirUrl('StructureDefinition', operation || '') : this.fhirUrl('StructureDefinition', idOrUrl, operation || '');
		// if isUrl add the idOrUrl to the query
		options = defu(options, isUrl ? { query: { url: idOrUrl } } : {});
		return this.fetchInternal<Bundle<ExtractResource<'StructureDefinition'>>>('GET', fhirUrl, options);
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
	readCapabilityStatement(options?: FetchOptions<any>): AsyncData<CapabilityStatement, any> | Promise<CapabilityStatement> {
		return this.fetchInternal<CapabilityStatement>('GET', this.fhirUrl('metadata'), options);
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
	readPatientEverything(id: string, options?: FetchOptions<any>): AsyncData<Bundle, any> | Promise<Bundle> {
		return this.fetchInternal<Bundle>('GET', this.fhirUrl('Patient', id, '$everything'), options);
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
	createResource<T extends Resource>(resource: T, options?: FetchOptions<any>): AsyncData<T, any> | Promise<T> {
		if (!resource.resourceType) {
			throw new Error('Missing resourceType');
		}
		return this.fetchInternal<T>('POST', this.fhirUrl(resource.resourceType), {
			body: JSON.stringify(resource),
			...options
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
	 * @param options - Optional fetch options.
	 * @returns The result of the create operation.
	 */

	createResourceIfNoneExist<T extends Resource>(resource: T, query: string, options?: FetchOptions<any>): AsyncData<T, any> | Promise<T> {
		options = defu(options, { headers: { 'If-None-Exist': query } });
		return this.fetchInternal<T>('POST', this.fhirUrl(resource.resourceType), {
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
	valueSetExpand(params: ValueSetExpandParams, options?: FetchOptions<any>): AsyncData<ValueSet, any> | Promise<ValueSet> {
		const url = this.fhirUrl('ValueSet', '$expand');
		url.search = new URLSearchParams(params as Record<string, string>).toString();
		return this.fetchInternal<ValueSet>('GET', url.toString(), options);
	}

	postResource<K extends ResourceType>(resourceType: K, id?: string | null, body: any = {}, operation?: any, options?: FetchOptions<any>): AsyncData<any, any> | Promise<any> {
		const params =  [ resourceType ] as string[];
		if (id) {
			params.push(id);
		}
		if (operation) {
			params.push(operation);
		}
		const url = this.fhirUrl(...params);
		return this.fetchInternal<any>('POST', url, {
			body: JSON.stringify(body || {}),
			...options
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
	upsertResource<T extends Resource>(resource: T, query: QueryTypes, options?: FetchOptions<any>): AsyncData<T, any> | Promise<T> {
		// remove clientIdStrategy from options if it exists
		const {
			clientIdStrategy,
			forceOnMissingId = false,
			...restOptions } = options || {};

		const path = [resource.resourceType] as string[];
		if(clientIdStrategy && resource?.id){
			// add clientIdStrategy to the paths
			path.push(resource.id)
		}
		const url = this.fhirUrl(...path);
		// add client id to the URL
		if (query) {
			url.search = getQueryString(query);
		}
		let method: FetchMethod = 'PUT';
		if(!resource?.id && forceOnMissingId === true){
			// if the resource does not have an id, use POST method -> otherwise it will fail
			method = 'POST';
		}
		return this.fetchInternal<T>(method, url, {
			body: JSON.stringify(resource),
			...restOptions
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
	updateResource<T extends Resource>(resource: T, options?: FetchOptions<any>): AsyncData<T, any> | Promise<T> {
		if (!resource.resourceType) {
			throw new Error('Missing resourceType');
		}
		if (!resource.id) {
			throw new Error('Missing id');
		}
		return this.fetchInternal<T>('PUT', this.fhirUrl(resource.resourceType, resource.id), {
			body: JSON.stringify(resource),
			...options
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
	patchResource<K extends ResourceType>(resourceType: K, id: string, operations: PatchOperation[], options?: FetchOptions<any>): AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>> {
		options = defu(options, {
			headers: { 'Content-Type': ContentType.JSON_PATCH }
		});
		return this.fetchInternal<ExtractResource<K>>('PATCH', this.fhirUrl(resourceType, id), {
			body: JSON.stringify(operations),
			...options
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
	deleteResource(resourceType: ResourceType, id: string, options?: FetchOptions<any>): AsyncData<any, any> | Promise<any> {
		return this.fetchInternal<any>('DELETE', this.fhirUrl(resourceType, id), options);
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
	executeBatch(bundle: Bundle, options?: FetchOptions<any>): AsyncData<Bundle, any> | Promise<Bundle> {
		return this.fetchInternal<Bundle>('POST', this.fhirBaseUrl, {
			body: JSON.stringify(bundle),
			...options
		});
	}
}