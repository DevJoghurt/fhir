import { $fetch } from 'ofetch';
import { maxSatisfying } from 'semver';

const FHIR_PACKAGES_ENDPOINT = 'https://packages.fhir.org';
const SIMPLIFIER_ENDPOINT = 'https://simplifier.net';


function downloadFile(url: string): Promise<ArrayBuffer> {
	return fetch(url)
		.then(x => x.arrayBuffer());
}

export function usePackageLoader() {


	async function downloadPackage(name: string, version: string) {
		const file = await downloadFile(`${FHIR_PACKAGES_ENDPOINT}/${name}/${version}`);
		const binary = Buffer.from(file)
	}

	async function searchPackage(searchString: string) {
		try {
			const resp = await $fetch('/ui/search/searchtokens',{
				baseURL: SIMPLIFIER_ENDPOINT,
				method: 'GET',
				query: {
					term: searchString,
					take: 10
				}
			})
			return {
				status: 'success',
				message: 'Package found',
				packages: resp
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

	async function findPackage(name: string, version: string) {
		try {
			let resolvedVersion = version;
			const res = await $fetch(name,{
				baseURL: FHIR_PACKAGES_ENDPOINT,
				method: 'GET',
				responseType: 'json'
			})
			if (version === 'latest') {
				if (res?.data?.['dist-tags']?.latest?.length) {
					resolvedVersion = res.data['dist-tags'].latest;
				} else{
					throw new Error('No latest version found')
				}
			} else if(/^\d+\.\d+\.x$/.test(version)) {
				if (res?.data?.versions) {
					const versions = Object.keys(res.data.versions);
					const latest = maxSatisfying(versions, version);
					if (latest) {
						resolvedVersion = latest;
					} else {
						throw new Error('No matching version found')
					}
				} else {
					throw new Error('No versions found')
				}
			} else {
				throw new Error('Invalid version format')
			}
			return {
				status: 'success',
				message: 'Package found',
				package: {
					name: res.data?.name || name,
					version: resolvedVersion,
					description: res.data.description,
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
		findPackage,
		searchPackage
	}
}