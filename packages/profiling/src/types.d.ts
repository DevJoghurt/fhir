import type { InstanceDefinition } from 'fsh-sushi/dist/fhirtypes';

type InstanceMeta = InstanceDefinition['_instanceMeta'];

interface ProfileExample extends InstanceMeta {
	fileName: string;
}

export type Profile = {
	id: string | undefined;
	resourceType: string;
	url: string;
	version: string | undefined;
	title: string;
	description: string;
	status: string | undefined;
	kind: string;
	baseDefinition: string;
	inProgress: boolean;
	examples: ProfileExample[];
	fileName: string;
	queryId: string;
};

export type Instance = {
	id: string | undefined;
	resourceType: string;
};

export type ValueSet = {
	id: string | undefined;
	resourceType: 'ValueSet';
	url: string;
	version: string | undefined;
	title: string;
	description: string;
	status: string | undefined;
};

export type CodeSystem = {
	id: string | undefined;
	resourceType: 'CodeSystem';
	url: string | undefined;
	version: string | undefined;
	title: string | undefined;
	description: string | undefined;
	status: string | undefined;
	date: string | undefined;
};

export type FhirProfilingDocumentation = {
	enabled?: boolean;
	layout?: 'fhirdocs';
	title?: string;
	description?: string;
};

export type FhirProfilingConfig = {
	dir: string;
	verbose: boolean;
	documentation: FhirProfilingDocumentation;
};

export type FhirProfilingContext = {
	config: FhirProfilingConfig;
	profiles: Profile[];
	valueSets: ValueSet[];
	codeSystems: CodeSystem[];
};