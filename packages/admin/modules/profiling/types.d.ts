export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'example';

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

export type PackageStatus = {
	process?: 'idle' | 'running' | 'completed' | 'failed';
	downloaded?: boolean;
	extracted?: boolean;
	loaded?: boolean;
	installed?: boolean;
}

export type Package = {
	identifier: string;
	status?: PackageStatus | null;
	compressedPackage?: CompressedPackage | null;
	storage?: StoragePackage | null;
	meta?: PackageMeta | null;
	files?: ProfileFile[] | null;
}