/**
 * Package installation reference types
 */

export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'capabilityStatement' | 'example';

export interface PackageMeta {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	fhirVersions?: string[];
	dependencies?: Record<string, string>;
}

export type ProfileFile = {
	type: ProfileType;
	status: {
		type: 'loaded' | 'installed' | 'failed' | 'skipped';
		message?: string;
	},
	name: string;
	resourceType: string;
	path: string;
	snapshot: boolean;
}

export type CompressedPackage = {
	baseName: string;
	dir: string;
	path: string;
}

export type StoragePackage = {
	baseName: string;
	dir: string;
}

export type DownloadPackage = {
	name: string;
	version: string;
}

export type PackageStatusProcess = 'idle' | 'running' | 'waiting';

export type PackageStatus = {
	downloaded?: boolean;
	extracted?: boolean;
	loaded?: boolean;
	analyzed?: boolean;
	installed?: boolean;
}

export type Package = {
	identifier: string;
	process?: PackageStatusProcess | null;
	status?: PackageStatus | null;
	download?: DownloadPackage | null;
	compressedPackage?: CompressedPackage | null;
	storage?: StoragePackage | null;
	meta?: PackageMeta | null;
	files?: ProfileFile[] | null;
}

/*
 * Package loader types @simplifier https://simplifier.net/packages
 */
export type PackageLoaderVersion = {
	name: string;
	version: string;
	description: string;
	dist: {
		shasum: string;
		tarball: string;
	},
	fhirVersion: string;
	url: string;
	unlisted?: string;
}

export type PackageLoaderResponse = {
	_id: string;
	name: string;
	description: string;
	'dist-tags': Record<string, string>;
	versions: Record<string,PackageLoaderVersion>;
}

export type PackageSearchResponse = {
	status: string;
	message: string;
	packages: Array<{
		Name: string;
		Value: string;
		Description: string;
	}>;
}