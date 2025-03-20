import {
	useState,
	useFetch,
	useRuntimeConfig,
	onMounted,
	ref
} from '#imports'
import type { Ref } from '#imports'
import { defu } from 'defu'
import type {
	ExtractResource,
	ResourceType,
	CapabilityStatement,
	OperationOutcome,
	Resource,
	Bundle
} from '@medplum/fhirtypes'
import type {
	QueryTypes,
	PatchOperation,
	FetchMethod,
	ExtendedFetchOptions
} from '../../utils'
import { FhirClient, encodeBase64 } from "../../utils"
import type { UseFetchOptions, AsyncData } from '#app'

type SessionState = {
	accessToken?: string
}

type FetchOptions<T> = Omit<UseFetchOptions<T>, 'method' | 'body' | 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'> & ExtendedFetchOptions;

type MedplumOptions = {
	clientId: string | null;
	clientSecret: string | null;
}

type UseFhirOptions = {
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
	 * Medplum options
	 */
	medplum?: MedplumOptions;

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

/**
 * A runtime fetch function that behaves similarly to useFetch but works at runtime.
 * It returns an object with data, error, and pending properties.
 */
export async function runtimeFetch<T = any>(
	url: string | URL,
	options: {
		method?: FetchMethod;
		headers?: Record<string, string>;
		body?: any;
		asynchRequest?: boolean;
	}
): Promise<{ data: Ref<T | null>; error: any; pending: Ref<boolean>}> {
	const data = ref<T | null>(null);
	const error = ref<any>(null);
	const pending = ref<boolean>(true);

	try {
		pending.value = true;
		data.value = await $fetch<T>(url.toString(), {
			method: options.method || 'GET',
			headers: options.headers,
			body: options.body,
		});
		error.value = null;
	} catch (err) {
		data.value = null;
		error.value = err;
	} finally {
		pending.value = false;
	}

	return { data, error, pending };
}

export function useFhir(options: UseFhirOptions = {
	useCredentials: false,
	logLevel: 'info'
}): {
	fhirUrl: (...path: string[]) => URL;
	fhirSearchUrl: (resourceType: ResourceType, query: QueryTypes) => URL;
	createUUID: () => string;
	readResource: <K extends ResourceType>(resourceType: K, id: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any>;
	search: <K extends ResourceType>(resourceType: K, query?: FetchOptions<any>['query'], options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>>, any>;
	readHistory: <K extends ResourceType>(resourceType?: K | null, id?: string | null, options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>> | Bundle, any>;
	readVersion: <K extends ResourceType>(resourceType: K, id: string, vid: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any>;
	readCapabilityStatement: (options?: FetchOptions<any>) => AsyncData<CapabilityStatement, any>;
	readStructureDefinition: (idOrUrl: string, operation?: '$snapshot' | '$meta', options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<'StructureDefinition'>>, any>;
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

	const sessionState = useState<SessionState>('fhir-session', () => ({}))

	const accessToken = sessionState.value.accessToken || null

	const isMounted = ref(false);

	onMounted(() => {
		isMounted.value = true;
	});

	const fetch = <T = any>(method: FetchMethod = 'GET', url: URL | string, fetchOptions?: FetchOptions<any>): AsyncData<T, any> => {
		url = url.toString();

		if (isMounted.value) {
			// Use runtimeFetch if the component is fully mounted
			return runtimeFetch<T>(url, {
				method,
				headers: {
					Accept: 'application/fhir+json',
					...(fetchOptions?.asynchRequest && { Prefer: 'respond-async' }),
					...(!config.useCredentials && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
					...(config.useCredentials && config.medplum?.clientId && config.medplum?.clientSecret
						? { Authorization: `Basic ${encodeBase64(config.medplum.clientId + ':' + config.medplum.clientSecret)}` }
						: {})
				},
				body: fetchOptions?.body,
			});
		}

		// Use useFetch if the component is not fully mounted
		return useFetch<T>(url, {
			method: method as any,
			...fetchOptions,
			onRequest({ options }) {
				options.headers.set('Accept', 'application/fhir+json');
				// Set request header for async requests
				if (fetchOptions?.asynchRequest) {
					options.headers.set('Prefer', 'respond-async');
				}
				// Set the request headers for authorization
				if (!config.useCredentials && accessToken) {
					options.headers.set('Authorization', `Bearer ${accessToken}`);
				} else if (config.useCredentials && config.medplum?.clientId && config.medplum?.clientSecret) {
					const basicAuth = encodeBase64(config.medplum.clientId + ':' + config.medplum.clientSecret);
					options.headers.set('Authorization', `Basic ${basicAuth}`);
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
		}) as AsyncData<T, any>;
	}

	const client = new FhirClient({
		server: config.server || 'hapi',
		serverUrl: config.serverUrl,
		baseUrl: config.basePath,
		logLevel: config?.logLevel || 'info'
	}, fetch);

	return {
		fhirUrl: client.fhirUrl.bind(client),
		fhirSearchUrl: client.fhirSearchUrl.bind(client),
		createUUID: client.createUUID.bind(client),
		readResource: client.readResource.bind(client),
		search: client.search.bind(client),
		readHistory: client.readHistory.bind(client),
		readVersion: client.readVersion.bind(client),
		readStructureDefinition: client.readStructureDefinition.bind(client),
		readCapabilityStatement: client.readCapabilityStatement.bind(client),
		readPatientEverything: client.readPatientEverything.bind(client),
		validateResource: client.validateResource.bind(client),
		createResource: client.createResource.bind(client),
		createResourceIfNoneExist: client.createResourceIfNoneExist.bind(client),
		upsertResource: client.upsertResource.bind(client),
		updateResource: client.updateResource.bind(client),
		patchResource: client.patchResource.bind(client),
		deleteResource: client.deleteResource.bind(client),
		executeBatch: client.executeBatch.bind(client)
	}
}