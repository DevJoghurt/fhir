import { useFhirClient, useStorage } from '#imports';
import type { NamingSystem, Resource, StructureDefinition } from '@medplum/fhirtypes'
import type { ProfileType, Package } from '../../types';
import { join } from "pathe";
import { Duplex } from 'node:stream';
import { tmpdir } from "node:os";
import { mkdir } from "node:fs";
import * as tar from 'tar';
import { globby } from 'globby';

const TMP_FOLDER = 'nhealth_fhir_profiling';


const isStructureDefinition = (resource: Resource): resource is StructureDefinition => {
	return resource.resourceType === 'StructureDefinition';
}

export async function loadFhirProfileIntoServer(resource: StructureDefinition | NamingSystem) {
	const { createResourceIfNoneExist, patchResource, readStructureDefinition } = useFhirClient();

	// check if resource is StructureDefinition and has a snapshot
	let needsToCreateSnapshot = resource.resourceType === 'StructureDefinition' && typeof resource?.snapshot === 'undefined';

	// Load the package into the server
	// use url / name as the key to check if the resource already exists
	// TODO: implement a version check to make updating resources easier
	let query = ''
	
	if(isStructureDefinition(resource)){
		query = `url=${encodeURIComponent(resource?.url || '')}`;
	} else if(resource.resourceType === 'NamingSystem'){ // Updated to use else if for clarity
		query = `name=${encodeURIComponent(resource?.name || '')}`;

	}
	const resp = await createResourceIfNoneExist(resource, query);
	if(!needsToCreateSnapshot){
		return resp;
	}
	if(!resp!.id){
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

export async function extractPackage(cPackage: Package) :Promise<string> {
	const compressedPackage = cPackage?.compressed;
	if(!compressedPackage){
		throw new Error('Package has no compressed file in storage');
	}
	const tmpFolder = join(tmpdir(), TMP_FOLDER, cPackage.identifier);
	await mkdir(tmpFolder, { recursive: true }, (err) => {
		if (err) throw err;
	});
	const tarFileBuffer = await useStorage(compressedPackage.baseName).getItemRaw(compressedPackage.file);
	const stream = new Duplex();
	stream.push(tarFileBuffer);
	stream.push(null);
	stream.pipe(
		tar.x({
		C: tmpFolder
		})
	);

	return await new Promise((resolve, reject) => {
		stream.on('finish', () => {
			resolve(tmpFolder);
		});
		stream.on('error', (err) => {
			reject(err);
		});
	});
}

/**
 *
 * This function returns the profile type based on the resourceType of the content.
 * nhealth uses a specific data structure to build a IG and load data into the FHIR server.
 * These are the types of profiles that are supported:
 * - codeSystem
 * - valueSet
 * - searchParameter
 * - extension
 * - profile
 * - example
 *
 * @param content
 * @returns ProfileType | null
 */
function resolveProfileType(content: Resource) : ProfileType | null {
	if(content?.resourceType === 'CodeSystem'){
		return 'codeSystem'
	}
	if(content?.resourceType === 'ValueSet'){
		return 'valueSet'
	}
	if(content?.resourceType === 'SearchParameter'){
		return 'searchParameter'
	}
	if(content?.resourceType === 'StructureDefinition'){
		if(content?.type === 'Extension'){
			return 'extension'
		}
		return 'profile'
	}
	// currently filter out CapabilityStatement and OperationDefinition
	if(['CapabilityStatement', 'OperationDefinition'].indexOf(content?.resourceType) !== -1){
		return null
	}
	if(content?.resourceType){
		return 'example'
	}
	return null
}

export async function analyzePackage(cPackage: Package) : Promise<FhirPofilePackage | null> {
	if(packageLink.origin === 'remote'){
		throw new Error('Package link origin must be downloaded and mounted first');
	}
	if(packageLink.type === 'compressed'){
		throw new Error('Package link type must be uncompressed first');
	}

	const profilingFiles = await globby(`${packageLink.link}/**/*.json`, {
		deep: 3,
	})
	const profilePackage = {} as FhirPofilePackage
	if(profilingFiles.length > 0){
		const storageKey = profilingFiles.find(file => file.endsWith('package.json'))
		if (storageKey === undefined) {
			console.warn(`No package meta file found in ${packageLink.link}`)
			return null
		}
		let packageMetaDefaults = {} as FhirPofilePackage
		if (storageKey.endsWith('package.json')) {
			packageMetaDefaults = await useStorage().getItem(storageKey) as FhirPofilePackage
		}
		profilePackage.name = packageMetaDefaults.name || 'none'
		// create a normalized name for the package by removing .,#,/,-
		profilePackage.version = packageMetaDefaults.version || 'none'
		// There seems to be a bug in magicast that doesn't allow for array defaults
		profilePackage.fhirVersions = Array.isArray(packageMetaDefaults?.fhirVersions) ? packageMetaDefaults.fhirVersions : ['4.0.1']
		profilePackage.author = packageMetaDefaults.author || 'none'
		profilePackage.description = packageMetaDefaults.description || 'none'
		profilePackage.dependencies = packageMetaDefaults.dependencies || {}
		profilePackage.files = []
		// filter all profiling files that are json and not package.json
		const profilingFilesFiltered = profilingFiles.filter(file => file.endsWith('.json') && !file.endsWith('package.json') && !file.endsWith('.index.json'))
		let fileNameMap = {} as Record<string, number>
		for (const file of profilingFilesFiltered) {
			const packageFile = await require(file)
			const type = resolveProfileType(packageFile)
			if(type){
				const fileNormalizedName = packageFile?.id.replaceAll(/[\.\,#\/-]/g, '_')
				if(fileNameMap[fileNormalizedName] === undefined){
					fileNameMap[fileNormalizedName] = 0
				}else{
					fileNameMap[fileNormalizedName] += 1
				}
				// File path needs to be relative to the profiling directory
				const relativePath = file.replace(join(storageKey, '/'), '')
				profilePackage.files.push({
					type,
					normalizedName: `f_${fileNormalizedName}${fileNameMap[fileNormalizedName] > 0 ? `_${fileNameMap[fileNormalizedName]}` : ''}`,
					resource: packageFile?.resource || 'none',
					snapshot: packageFile?.snapshot? true : false,
					path: relativePath,
				})
			}
		}
	}
	return profilePackage;
}