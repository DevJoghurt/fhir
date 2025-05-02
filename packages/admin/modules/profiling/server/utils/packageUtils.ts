import { useFhirClient, useStorage } from '#imports';
import type { NamingSystem, Resource, StructureDefinition } from '@medplum/fhirtypes'
import type { ProfileType, Package, PackageMeta, ProfileFile, CompressedPackage, StoragePackage, DownloadPackage } from '#fhirtypes/profiling';
import fsDriver from "unstorage/drivers/fs";
import { join } from "pathe";
import { Duplex } from 'node:stream';
import { tmpdir } from "node:os";
import { mkdir } from "node:fs";
import * as tar from 'tar';
import type { Storage } from 'unstorage';
import semver from 'semver';
import { fileTypeFromBuffer } from 'file-type';

const TMP_FOLDER = 'nhealth_fhir_packages';
const PACKAGES_BASE_NAME = 'packages';
const DOWNLOADS_BASE_NAME = 'downloads';


const isStructureDefinition = (resource: Resource): resource is StructureDefinition => {
	return resource.resourceType === 'StructureDefinition';
}

async function loadFhirProfileIntoServer(resource: StructureDefinition | NamingSystem) {
	const { upsertResource, patchResource, readStructureDefinition } = useFhirClient();

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
	let resp = null as StructureDefinition | NamingSystem | null;
	try	{
		resp = await upsertResource(resource, query, {
			clientIdStrategy: true,
			forceOnMissingId: true
		});
	}catch (e) {
		return {
			status: 'error',
			data: e?.cause || e?.message || 'Failed to create resource',
		}
	}
	if(!needsToCreateSnapshot){
		return {
			status: 'success',
			data: resp,
		};
	}
	if(!resp!.id){
		return {
			status: 'error',
			data: 'Failed to create resource',
		}
	}
	// create a snapshot if it does not exist and patch the resource
	let sd = null as StructureDefinition | null;
	try	{
		sd = await readStructureDefinition(resp.id, '$snapshot');
	}catch (e) {
		return {
			status: 'error',
			data: e?.cause || e?.message || 'Failed to create resource',
		}
	}
	if(sd.snapshot){
		const patchedResp = await patchResource('StructureDefinition', resp.id, [{
			op: 'add',
			path: '/snapshot',
			value: sd.snapshot
		}]);
		return {
			status: 'success',
			data: patchedResp,
		}
	}
	return {
		status: 'error',
		data: 'Failed to create snapshot',
	}
}

function resolveStoragePath(storage: CompressedPackage | StoragePackage | undefined | null): string {
	if(storage?.baseName && storage?.dir && (storage?.dir !== '')) {
		return `${storage.baseName}:${storage.dir}`
	}
	return storage?.baseName || ''
}

async function downloadPackage(pkg: DownloadPackage) : Promise<CompressedPackage | null> {
	let fileName = `${pkg.name}#${pkg.version}`
	const { downloadPackage : dP } = usePackageLoader()
	const storage = useStorage(DOWNLOADS_BASE_NAME)

	try {
		const pkgFileBuffer = await dP(pkg.name, pkg.version)
		const buffer = Buffer.from(pkgFileBuffer);
		const fileType = await fileTypeFromBuffer(buffer);
		if(fileType?.ext){
			fileName += `.${fileType.ext}`
		}
		await storage.setItemRaw(fileName, buffer);
	} catch (error) {
		return null
	}
	finally {
		return {
			baseName: DOWNLOADS_BASE_NAME,
			dir: '',
			path: fileName,
		}
	}
}

async function extractPackage(cPackage: Partial<Package>): Promise<string> {
	const compressedPackage = cPackage?.compressedPackage;
	if (!compressedPackage || !cPackage.identifier) {
		throw new Error('Package has no compressed file in storage');
	}
	const tmpFolder = join(tmpdir(), TMP_FOLDER, PACKAGES_BASE_NAME, cPackage.identifier);
	await mkdir(tmpFolder, { recursive: true }, (err) => {
		if (err) throw err;
	});
	const tarFileBuffer = await useStorage(resolveStoragePath(compressedPackage)).getItemRaw(compressedPackage.path);
	const stream = new Duplex();
	stream.push(tarFileBuffer);
	stream.push(null);

	return new Promise((resolve, reject) => {
		const extractStream = tar.x({
			C: tmpFolder,
		});
		extractStream.on('finish', () => {
			resolve(tmpFolder);
		});
		extractStream.on('error', (err) => {
			reject(err);
		});
		stream.pipe(extractStream);
	});
}

/**
 * Function to mount the profiling folder in the storage.
 * Root directory is always [os_tmp_folder]/TMP_FOLDER
 * TODO: add support for other storage drivers like S3
 */
function mountPackageStorage(): void {
	const storage = useStorage()
	const tmpFolder = join(tmpdir(), TMP_FOLDER);
	// mount packages folder in the storage
	storage.mount(PACKAGES_BASE_NAME, fsDriver({
		base: join(tmpFolder, PACKAGES_BASE_NAME),
		watchOptions: {
			depth: 3
		},
		readOnly: true
	}));
	// mount downloads folder in the storage
	storage.mount(DOWNLOADS_BASE_NAME, fsDriver({
		base: join(tmpFolder, DOWNLOADS_BASE_NAME),
		watchOptions: {
			depth: 3
		}
	}));
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
	if(content?.resourceType === 'CapabilityStatement'){
		return 'capabilityStatement'
	}
	// currently filter out CapabilityStatement and OperationDefinition
	if(['OperationDefinition'].indexOf(content?.resourceType) !== -1){
		return null
	}
	if(content?.resourceType){
		return 'example'
	}
	return null
}

async function resolvePackageMeta(storage: Storage,files: string[]) : Promise<PackageMeta | null> {
	const packageJsonFilePath = files.find(file => file.endsWith('package.json'))
	if(!packageJsonFilePath){
		console.error(`No package.json file found in ${storage}`);
		return null
	}
	const packageJsonFile = await storage.getItem(packageJsonFilePath) as any
	if(!packageJsonFile){
		console.error(`Failed to load package.json file from ${storage}`);
		return null
	}
	const packageJson = {
		name: packageJsonFile.name || 'none',
		version: packageJsonFile.version || 'none',
		description: packageJsonFile.description || 'none',
		fhirVersions: packageJsonFile.fhirVersions || packageJsonFile['fhir-version-list'] || ['4.0.1'],
		dependencies: packageJsonFile.dependencies || {},
	} as PackageMeta

	return packageJson
}

const normalizeResourceName = (type: ProfileType, resource: StructureDefinition | NamingSystem) => {
	if(type === 'example'){
		return resource?.id || 'none'
	}
	return resource?.name || resource?.id || 'none'
}

async function analyzePackage(storage: Storage, files: string[]) : Promise<ProfileFile[] | null> {
	const packageFiles = [] as ProfileFile[]
	if(files.length > 0){
		// filter all profiling files that are json and not package.json
		const profilingFilesFiltered = files.filter(file => file.endsWith('.json') && !file.endsWith('package.json') && !file.endsWith('.index.json'))
		for (const file of profilingFilesFiltered) {
			const resource = await storage.getItem(file) as StructureDefinition | NamingSystem
			const type = resolveProfileType(resource)
			if(type){
				packageFiles.push({
					type,
					name: normalizeResourceName(type, resource),
					status: {
						type: 'loaded'
					},
					resourceType: resource?.resourceType || 'none',
					snapshot: resource?.snapshot? true : false,
					path: file,
				})
			}
		}
	}
	return packageFiles;
}

/**
 * This function checks if dependencies of a package are already installed.
 * If package status is NULL or package is only loaded and not installed, it will return false
 *
 * @returns boolean
 * @param dependencies - dependencies of the package
 * @param packages - list of installed packages
 * @param options - options for the function
 * @example checkPackageDependencies({ 'package-name': '1.0.0' }, [{ name: 'package-name', version: '1.0.0' }])
 */
type CheckPackageDependenciesOptions = {
	ignoreDependencies?: string[]
}
type PackageDependency = {
	package: string;
	version: string;
	status: 'missing' | 'loaded' | 'installed';
	loaded: boolean;
	installed: boolean;
}
function checkPackageDependencies(dependencies: Record<string, string> | undefined, packages: Package[], options?: CheckPackageDependenciesOptions) : PackageDependency[] {
	const { ignoreDependencies = [] } = options || {}
	// deep clone packages to avoid mutating the original array
	const packagesClone = JSON.parse(JSON.stringify(packages)) as Package[]

	let transformedDependencies = Object.entries(dependencies || {}).map(([key, value]) => ({
		package: key,
		version: value,
		status: 'missing'
	})) as PackageDependency[];
	transformedDependencies = transformedDependencies.filter(dep => !ignoreDependencies.includes(dep.package))

	if(transformedDependencies.length === 0){
		return []
	}
	for (const dep of transformedDependencies) {
		const packagesFound = packagesClone.filter(pkg => pkg.meta?.name === dep.package)

		for (const depPkg of packagesFound) {
			const satisfiesVersion = semver.satisfies(depPkg.meta?.version || '', dep.version)
			if(!satisfiesVersion){
				continue
			}
			// check if the package is installed and loaded
			if(depPkg && depPkg.status && depPkg.status.loaded === true && depPkg.status.installed === true){
				dep.status = 'installed'
			}
			// check if the package is loaded and not installed
			if(depPkg && depPkg.status && depPkg.status.loaded === true && depPkg.status.installed === false){
				dep.status = 'loaded'
			}
		}
	}
	return transformedDependencies
}

export function usePackageUtils() {
	return {
		extractPackage,
		mountPackageStorage,
		resolvePackageMeta,
		analyzePackage,
		loadFhirProfileIntoServer,
		resolveStoragePath,
		checkPackageDependencies,
		downloadPackage,
		PACKAGES_BASE_NAME
	}
}