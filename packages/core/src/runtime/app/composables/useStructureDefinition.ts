import {
	useFhir,
	useState
 } from '#imports';

import type { Ref } from '#imports';

import type {
	ElementDefinition,
	StructureDefinition,
	Extension,
	Coding
  } from '@medplum/fhirtypes';

const supportedCodes = [ 'boolean' ] as const;
export type SupportedCode = (typeof supportedCodes)[number];

/**
 * Internal representation of a non-primitive FHIR type, suitable for use in resource validation
 */
export interface InternalTypeSchema {
	name: string;
	type: string;
	path: string;
	title?: string;
	url?: string;
	version?: string;
	kind?: string;
	description?: string;
	raw: StructureDefinition;
	element: InternalSchemaElement[];
  }

  export interface InternalSchemaElement {
	name: string;
	description: string;
	path: string;
	min: number;
	max: number;
	isRequired: boolean;
	isArray: boolean;
	type: 'boolean';
	element?: InternalSchemaElement[];
  }

  export interface ElementType {
	code: string;
	targetProfile?: string[];
	profile?: string[];
  }

  export interface Constraint {
	key: string;
	severity: 'error' | 'warning';
	expression: string;
	description: string;
  }

  export interface SlicingRules {
	discriminator: SliceDiscriminator[];
	ordered: boolean;
	rule?: 'open' | 'closed' | 'openAtEnd';
	slices: SliceDefinition[];
  }

  export interface SliceDefinition extends Omit<InternalSchemaElement, 'slicing'> {
	name: string;
	definition?: string;
	elements: Record<string, InternalSchemaElement>;
  }

  export interface SliceDiscriminator {
	path: string;
	type: string;
  }

  interface BackboneContext {
	type: InternalTypeSchema;
	path: string;
	parent?: BackboneContext;
  }

/**
 * Get instance of StructureDefinitionHandler
 */
export function useStructureDefinition() {

	return new StructureDefinitionHandler();
}

/**
 * StructureDefinitionHandler class
 * Stores all loaded StructureDefinitions and provides methods to access them
 */
class StructureDefinitionHandler {
	private readonly structureDefinitions: Ref<Record<string, InternalTypeSchema>> = useState('fhir:structureDefinitions', () => Object.create(null));

	constructor() {


	}

	async loadResource(resourceUrl: string): Promise<InternalTypeSchema | null> {

		// return the resource if it is already loaded
		//if (this.structureDefinitions.value[resourceUrl]) {
		//	return this.structureDefinitions.value[resourceUrl];
		//}

		const { readStructureDefinition } = useFhir()

		const { data } = await readStructureDefinition(resourceUrl)

		const sd = data.value?.entry && data.value.entry?.length > 0 ? data.value.entry[0].resource : null

		if (!sd) {
			return null;
		}
		const element = await this.parseElement(sd.snapshot?.element || []);

		const path = elementPath(sd?.snapshot?.element[0]) || sd.name;
		this.structureDefinitions.value[resourceUrl] = {
			name: sd.name as string,
			path: path,
			title: sd.title,
			type: sd.type,
			url: sd.url as string,
			version: sd.version,
			kind: sd.kind,
			element,
			raw: sd,
			description: getDescription(sd),
		};

		return this.structureDefinitions.value[resourceUrl];
	}

	async parseElement(elements: ElementDefinition[]): Promise<InternalSchemaElement[]> {
		const result: InternalSchemaElement[] = [];
		const stack: BackboneContext[] = [];

		for(const el of elements){
			const type = codingType(el.type || []);
			if(type === null){
				continue;
			}
			const path = elementPath(el);
			const currentElement: InternalSchemaElement = {
				name: el.sliceName || el.label || getLastPathElementAsName(path) || '',
				description: el.definition || el.short || '',
				path: path || '',
				min: el.min || 0,
				max: parseCardinality(el?.max || '1'),
				isRequired: el?.min ? el.min > 0 : false,
				type: type,
				isArray: el.max === '*' || el.max === '-1',
			};

			result.push(currentElement);
		}

		return result;
	}

}

/**
 * Get last element of the path and capitalize it.
 * @param path - The path to get the last element from
 * @returns The last element of the path
 */
function getLastPathElementAsName(path: string| null): string {
	if(!path){
		return '';
	}
	const parts = path.split('.');
	return capitalize(parts[parts.length - 1]);
}

/**
 * Capitalizes the first letter of the given string.
 * @param s - The string to capitalize.
 * @returns	The capitalized string.
 */
const capitalize = <T extends string>(s: T | null) => (
	s? s[0].toUpperCase() + s.slice(1) : null
) as Capitalize<typeof s extends string ? string : T>;

/**
 * Returns the coding type of the given element.
 * Filters supported coding types.
 * @param codingType - The coding type array.
 * @returns The coding type code if present; null otherwise.
 */
function codingType(codingType: ElementType[]): SupportedCode | null {
	if (codingType.length === 0 || !codingType[0].code) {
		return null;
	}
	// Filter out unsupported coding types
	if (!supportedCodes.includes(codingType[0].code as SupportedCode)) {
		return null;
	}
	return codingType[0].code as SupportedCode;
}

  /**
 * Returns an extension by extension URLs.
 * @param resource - The base resource.
 * @param urls - Array of extension URLs. Each entry represents a nested extension.
 * @returns The extension object if found; undefined otherwise.
 */
function getExtension(resource: any, ...urls: string[]): Extension | undefined {
	// Let curr be the current resource or extension. Extensions can be nested.
	let curr: any = resource;

	// For each of the urls, try to find a matching nested extension.
	for (let i = 0; i < urls.length && curr; i++) {
		curr = (curr?.extension as Extension[] | undefined)?.find((e) => e.url === urls[i]);
	}

	return curr;
}

function parseCardinality(c: string): number {
	return c === '*' ? Number.POSITIVE_INFINITY : Number.parseInt(c, 10);
}

function elementPath(element: ElementDefinition | undefined, prefix = ''): string | null {
	if (!element) {
		return null;
	}
	return trimPrefix(element.path, prefix);
}

function trimPrefix(str: string | undefined, prefix: string): string {
	if (!str) {
		return '';
	}
	if (prefix && str.startsWith(prefix)) {
		return str.substring(prefix.length + 1);
	}
	return str;
}

  /**
 * Tests whether two element paths are compatible, i.e. whether the child path is nested under the parent.
 * @param parent - The expected parent path, which should be a prefix of the child path.
 * @param child - The child path to test for compatibility with the parent path.
 * @returns True if the given path is a child of the parent.
 */
function pathsCompatible(parent: string | undefined, child: string | undefined): boolean {
	if (!parent || !child) {
		return false;
	}
	return child.startsWith(parent + '.') || child === parent;
}


function hasDefaultExtensionSlice(element: ElementDefinition): boolean {
	const discriminators = element.slicing?.discriminator;
	return Boolean(
		element.type?.some((t) => t.code === 'Extension') &&
		discriminators?.length === 1 &&
		discriminators[0].type === 'value' &&
		discriminators[0].path === 'url'
	);
}

function getDescription(sd: StructureDefinition): string | undefined {
	let result = sd.description;

	// Many description strings start with an unwanted prefix "Base StructureDefinition for X Type: "
	// For example:
	// Base StructureDefinition for Age Type: A duration of time during which an organism (or a process) has existed.
	// If the description starts with the name of the resource type, remove it.
	if (result?.startsWith(`Base StructureDefinition for ${sd.name} Type: `)) {
		result = result.substring(`Base StructureDefinition for ${sd.name} Type: `.length);
	}

	return result;
}