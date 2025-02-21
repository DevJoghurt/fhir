import { defu } from 'defu';
import { FhirClient, encodeBase64 } from '../../utils';
import { useRuntimeConfig } from '#imports';
import { $fetch, type FetchOptions as OfetchOptions } from 'ofetch';
import type { AsyncData } from '#app'
import type {
	ExtractResource,
	ResourceType,
	CapabilityStatement,
	OperationOutcome,
	Resource,
	Bundle
} from '@medplum/fhirtypes';
import type {
	QueryTypes,
	PatchOperation,
	FetchMethod,
	ExtendedFetchOptions
} from '../../utils';

type FetchOptions<T> = Omit<OfetchOptions<any>, 'method' | 'body' | 'onRequest' | 'onRequestError' | 'onResponse' | 'onResponseError'> & ExtendedFetchOptions;

type MedplumOptions = {
	clientId: string | null;
	clientSecret: string | null;
}

type UseFhirOptions = {
	server?: 'hapi' | 'medplum';
	serverUrl?: string;
	baseUrl?: string;
	accessToken?: string;
	medplum?: MedplumOptions;
	useCredentials?: boolean;
	logLevel?: 'silent' | 'debug' | 'info' | 'warn' | 'error';
}

export function useFhir(options: UseFhirOptions = {
	useCredentials: false,
	logLevel: 'info'
}): {
	fhirUrl: (...path: string[]) => URL;
	fhirSearchUrl: (resourceType: ResourceType, query: QueryTypes) => URL;
	readResource: <K extends ResourceType>(resourceType: K, id: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>>;
	search: <K extends ResourceType>(resourceType: K, query?: FetchOptions<any>['query'], options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>>, any> | Promise<Bundle<ExtractResource<K>>>;
	readHistory: <K extends ResourceType>(resourceType?: K | null, id?: string | null, options?: FetchOptions<any>) => AsyncData<Bundle<ExtractResource<K>> | Bundle, any> | Promise<Bundle<ExtractResource<K>> | Bundle>;
	readVersion: <K extends ResourceType>(resourceType: K, id: string, vid: string, options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>>;
	readCapabilityStatement: (options?: FetchOptions<any>) => AsyncData<CapabilityStatement, any> | Promise<CapabilityStatement>;
	readStructureDefinition: <K extends ResourceType>(resourceType: K, operation?: '$snapshot' | '$questionnaire', options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>>;
	readPatientEverything: (id: string, options?: FetchOptions<any>) => AsyncData<Bundle, any> | Promise<Bundle>;
	validateResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<OperationOutcome, any> | Promise<OperationOutcome>;
	createResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<T, any> | Promise<T>;
	createResourceIfNoneExist: <T extends Resource>(resource: T, query: string, options?: FetchOptions<any>) => AsyncData<T, any> | Promise<T>;
	upsertResource: <T extends Resource>(resource: T, query: QueryTypes, options?: FetchOptions<any>) => AsyncData<T, any> | Promise<T>;
	updateResource: <T extends Resource>(resource: T, options?: FetchOptions<any>) => AsyncData<T, any> | Promise<T>;
	patchResource: <K extends ResourceType>(resourceType: K, id: string, operations: PatchOperation[], options?: FetchOptions<any>) => AsyncData<ExtractResource<K>, any> | Promise<ExtractResource<K>>;
	deleteResource: (resourceType: ResourceType, id: string, options?: FetchOptions<any>) => AsyncData<any, any> | Promise<any>;
	executeBatch: (bundle: Bundle, options?: FetchOptions<any>) => AsyncData<Bundle, any> | Promise<Bundle>;
} {

	const config = defu(
		options,
		useRuntimeConfig().public?.fhir || {},
		useRuntimeConfig()?.fhir || {}
	);

	const fetch = async <T = any>(method: FetchMethod = 'GET', url: URL | string, fetchOptions?: FetchOptions<any>): Promise<T> => {
		url = url.toString();

		return $fetch<T>(url, {
			method: method as any,
			...fetchOptions,
			async onRequest({ options }) {
				options.headers = options.headers || {};
				options.headers['Accept'] = 'application/fhir+json';
				if (fetchOptions?.asynchRequest) {
					options.headers['Prefer'] = 'respond-async';
				}
				if (!config.useCredentials && config.accessToken) {
					options.headers['Authorization'] = `Bearer ${config.accessToken}`;
				} else if (config.useCredentials && config.medplum?.clientId && config.medplum?.clientSecret) {
					const basicAuth = encodeBase64(config.medplum.clientId + ':' + config.medplum.clientSecret);
					options.headers['Authorization'] = `Basic ${basicAuth}`;
				}
			},
			onRequestError({ request, options, error }) {
				// TODO: Handle the request errors
			},
			onResponse({ response }) {
				// TODO: Process the response data
			},
			onResponseError({ request, response, options }) {
				if (response.status === 401) {
					// handle unauthorized requests
				}
			},
		});
	};

	const client = new FhirClient({
		server: config.server || 'hapi',
		serverUrl: config.serverUrl,
		baseUrl: config.basePath,
		logLevel: config?.logLevel || 'info'
	}, fetch);

	return {
		fhirUrl: client.fhirUrl.bind(client),
		fhirSearchUrl: client.fhirSearchUrl.bind(client),
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
	};
}