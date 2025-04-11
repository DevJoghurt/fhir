type PackageType = 'dir' | 'tar'

export interface FhirPofilePackage {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	fhirVersions?: string[];
	dependencies?: Record<string, string>;
	files?: PackageFile[];
}

export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'example' | 'tar';

export type PackageFile = {
	type: ProfileType;
	normalizedName: string;
	resource: string;
	path: string;
	snapshot: boolean;
}

export interface FhirProfilePackageMeta extends FhirPofilePackage {
	type: PackageType;
	normalizedName: string;
	files: PackageFile[];
}