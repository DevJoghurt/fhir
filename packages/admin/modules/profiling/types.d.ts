export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'example';

export interface PofileMeta {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	fhirVersions?: string[];
	dependencies?: Record<string, string>;
}

export type ProfileFile = {
	type: ProfileType;
	normalizedName: string;
	resource: string;
	path: string;
	snapshot: boolean;
}

export type CompressedPackage = {
	baseName: string,
	file: string
}

export type Package = {
	identifier: string;
	compressed?: CompressedPackage | null;
	mounted: {
		baseName: string;
		dir: string;
		paths: string[];
	} | false;
	meta?: PofileMeta;
	files?: ProfileFile[];
}