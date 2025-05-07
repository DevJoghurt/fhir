import { $fetch } from 'ofetch';
import { maxSatisfying } from 'semver';
import type { PackageLoaderResponse } from '#fhirtypes/profiling';

const FHIR_PACKAGES_ENDPOINT = 'https://packages.fhir.org';
const SIMPLIFIER_ENDPOINT = 'https://simplifier.net';


export function usePackageLoader() {


	async function downloadPackage(name: string, version: string) {
		return fetch(`${FHIR_PACKAGES_ENDPOINT}/${name}/${version}`)
			.then(x => x.arrayBuffer());
	}

	async function searchPackage(searchString: string, limit: number) {
		try {
			const resp = await $fetch('/ui/search/searchtokens',{
				baseURL: SIMPLIFIER_ENDPOINT,
				method: 'GET',
				query: {
					term: searchString,
					take: 100
				}
			})
			const filteredPackages = resp.filter((item: any) => item.Name === 'package');
			return {
				status: 'success',
				message: 'Package found',
				packages: filteredPackages
			}
		}
		catch (e) {
			return {
				status: 'error',
				message: 'Package not found',
				packages: null
			}
		}
	}



	async function findPackage(name: string) {
		try {
			const resp = await $fetch<PackageLoaderResponse>(name,{
				baseURL: FHIR_PACKAGES_ENDPOINT,
				method: 'GET',
				responseType: 'json'
			})
			return {
				status: 'success',
				message: 'Package found',
				package: resp
			}
		}
		catch (e) {
			return {
				status: 'error',
				message: 'Package not found',
				error: e
			}
		}
	}

	async function resolvePackageVersion(name: string, version: string) {
		try {
			let resolvedVersion = version;
			const data = await $fetch(name,{
				baseURL: FHIR_PACKAGES_ENDPOINT,
				method: 'GET',
				responseType: 'json'
			})
			if (version === 'latest') {
				if (data?.['dist-tags']?.latest?.length) {
					resolvedVersion = data['dist-tags'].latest;
				} else{
					throw new Error('No latest version found')
				}
			} else  {
				if (data?.versions) {
					const versions = Object.keys(data.versions);
					const latest = maxSatisfying(versions, version);
					if (latest) {
						resolvedVersion = latest;
					} else {
						throw new Error('No matching version found')
					}
				} else {
					throw new Error('No versions found')
				}
			}
			return {
				status: 'success',
				message: 'Package found',
				package: {
					name: data?.name || name,
					version: resolvedVersion,
					description: data.description,
				}
			}
		}
		catch (e) {
			return {
				status: 'error',
				message: 'Package not found',
				package: null
			}
		}
	}

	return {
		downloadPackage,
		resolvePackageVersion,
		findPackage,
		searchPackage
	}
}