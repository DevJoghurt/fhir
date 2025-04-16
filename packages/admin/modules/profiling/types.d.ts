export type ProfileType = 'extension' | 'profile' | 'codeSystem' | 'valueSet' | 'searchParameter' | 'example';

export interface PofileMeta {
	name: string;
	version?: string;
	description?: string;
	author?: string;
	fhirVersions: string[];
	dependencies?: Record<string, string>;
}

export type ProfileFile = {
	type: ProfileType;
	name: string;
	resourceType: string;
	path: string;
	snapshot: boolean;
}

export type CompressedPackage = {
	baseName: string,
	path: string
}

export type Package = {
	identifier: string;
	status?: 'idle' | 'in-process' | 'error' | 'done';
	ingested?: boolean;
	compressed?: CompressedPackage | null;
	mounted: string | null;
	meta?: PofileMeta;
	files?: ProfileFile[];
}