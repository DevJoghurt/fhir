type PackageType = 'dir' | 'tar'

export interface FhirPofilePackage {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	fhirVersions?: string[];
	dependencies?: Record<string, string>;
}

export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'example';

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