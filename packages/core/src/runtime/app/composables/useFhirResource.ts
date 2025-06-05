import {
	useFhirClient,
	useState,
	reactive
 } from '#imports';

import type { Ref } from '#imports';

import type {
	ElementDefinition,
	StructureDefinition,
	Extension,
	Coding,
	ElementDefinitionBinding
  } from '@medplum/fhirtypes';
import defu from 'defu';

export const supportedCodingTypes = [ 'id', 'unsignedInt', 'boolean', 'uri', 'string', 'Identifier', 'HumanName', 'code', 'Code', 'date', 'integer', 'BackboneElement' ] as const;
export type SupportedCodingType = (typeof supportedCodingTypes)[number];

/**
 * Internal representation of a non-primitive FHIR type, suitable for use in resource validation
 */
export interface InternalTypeSchema {
	label: string;
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
	label: string;
	description: string;
	name: string;
	path: string;
	min: number;
	max: number;
	isMultiCode: boolean;
	isRequired: boolean;
	isArray: boolean;
	type: SupportedCodingType | SupportedCodingType[];
	binding?: ElementDefinitionBinding;
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

interface ElementState {
	[ key: string ]: any;
}

interface Resource extends ElementState {
	resourceType: string;
	id?: string;
	meta: {
		profile: string[];
	}
}

interface ElementDefinitionTree extends ElementDefinition {
	element?: ElementDefinitionTree[];
}

/**
 * Working with FHIR resources
 * @see https://www.hl7.org/fhir/structuredefinition.html
 * @see https://www.hl7.org/fhir/elementdefinition.html
 *
 * It uses the StructureDefinition resource to load the structure of a FHIR resource.
 * The StructureDefinition resource contains the definition of a FHIR resource, including its elements, types, and constraints.
 * It builds an internal element tree structure from the StructureDefinition resource snapshot.
 * It also provides methods to load a StructureDefinition resource, parse its elements, and create a resource from the loaded StructureDefinition.
 * It also provides methods to get the state of a resource and create a resource from the state.
 */
export function useFhirResource() {
	const resources: Ref<Record<string, InternalTypeSchema>> = useState('fhir:sd:resources', () => Object.create(null));

	const loadResourceDefinition = async (resourceUrl: string | null, forceReload: boolean = false): Promise<InternalTypeSchema | null> => {
		if (!resourceUrl) {
			return null;
		}

		// return the resource if it is already loaded
		if (!forceReload && resources.value[resourceUrl]) {
			return resources.value[resourceUrl];
		}

		const { search } = useFhirClient()

		const data = await search('StructureDefinition',{
			url: resourceUrl
		})

		const sd = data?.entry && data?.entry?.length > 0 ? data?.entry[0].resource : null

		if (!sd) {
			return null;
		}

		const elementTree = buildTree(sd.snapshot?.element || [])

		const element = transformElement(elementTree);

		const path = normalizePath(sd?.snapshot?.element[0].path) || sd.name;
		resources.value[resourceUrl] = {
			label: sd.name as string,
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

		return resources.value[resourceUrl];
	}

	/**
	 *  Creates a resource state from element tree structure -> only use the first level of the element tree structure
	 * 	@param elements - The element tree structure
	 * 	@param defaultState - The default state of the resource
	 * 	@returns The resource state
	 **/
	const createResourceState = (elements: InternalSchemaElement[], defaultState: ElementState = {}): ElementState => {
		const state: ElementState = {};
		state.resourceType = defaultState?.resourceType || elements[0]?.path?.split('.')[0] || null;
		state.id = defaultState?.id || null;
		state.meta = defaultState?.meta || { };

		for (const element of elements) {
			if (element.isArray) {
				state[element.name] = state[element.name] || [];
			} else {
				state[element.name] = state[element.name] || null;
			}
		}
		// handle currently not supported form elements
		for (const dS in defaultState) {
			if (defaultState.hasOwnProperty(dS)) {
				if (state[dS] === undefined || state[dS] === null) {
					state[dS] = defaultState[dS];
				}
				// if the state is an array and the default state is an empty array
				else if (Array.isArray(state[dS]) && state[dS].length === 0) {
					state[dS] = [...defaultState[dS]];
				}
			}
		}
		return reactive(state);
	}

	const generateResource = (resourceDefinition: InternalTypeSchema | null, resourceState: ElementState, originalState: ElementState = {}): Resource | null => {
		if (!resourceDefinition) {
			return null;
		}

		let resource = {
			resourceType: resourceDefinition.type,
			meta: {
				profile: [resourceDefinition.url],
			}
		} as Resource;

		if(resourceState.id){
			resource.id = resourceState.id;
		}
		if(resourceState.meta){
			resource.meta = defu(resourceState.meta, resource.meta);
		}

		const normalizedResource = normalizeResource(resourceDefinition.element, resourceState, originalState);

		// merge the resource state
		resource = { ...normalizedResource, ...resource };

		return resource;
	}

	return {
		loadResourceDefinition,
		createResourceState,
		generateResource,
		resources,
	};
}

/**
 * Build a tree structure from the given data based on the path property.
 * The tree structure is built by splitting the path property by '.' and creating nested objects.
 * @param data - The data to build the tree from
 * @returns The tree structure
 */
// TODO: make it more robust -> this approach assumes that the data are organized in a way that the path property is always present and valid in order to build the tree structure correctly.
// there need to be checks to ensure that the data is valid and that the tree structure is built correctly.
// maybe add also a check to nesure that nested data are always a BackboneElement
function buildTree(data: ElementDefinition[]): ElementDefinitionTree[] {
	const root: any[] = [];
	const pathMap: Record<string, any> = {};

	data.forEach(item => {
		const segments = item.path.split('.');
		let currentLevel = root;

		segments.forEach((segment, index) => {
			const fullPath = segments.slice(0, index + 1).join('.');
			if (!pathMap[fullPath]) {
				const newNode: any = { ...item, path: fullPath, element: [] };
				if (index !== segments.length - 1) {
					// Remove properties that are not relevant for intermediate nodes
					delete newNode.type;
				}
				pathMap[fullPath] = newNode;
				currentLevel.push(newNode);
			}
			currentLevel = pathMap[fullPath].element;
		});
	});

	return root[0] ? root[0].element : [] as ElementDefinitionTree[];
}

/**
 * Transform the element tree structure into an internal schema element structure.
 * The transformation is done by iterating over the elements and creating a new object with the relevant properties.
 * The transformation also handles nested elements by recursively calling the transformElement function.
 * @param elements - The element tree structure
 * @returns The internal schema element structure
 * */
const transformElement = (elements: ElementDefinitionTree[]): InternalSchemaElement[] => {
	const result: InternalSchemaElement[] = [];

	for (const el of elements) {
		const type = codingType(el.type || []);
		if (type === null) {
			// Skip unsupported types
			continue;
		}

		const path = normalizePath(el.path);

		const parts = path.split('.');

		const currentElement: InternalSchemaElement = {
			label: el.sliceName || el.label || getLastPathElementAsName(path) || '',
			description: el.definition || el.short || '',
			name: parts[parts.length - 1] || '',
			path: path,
			min: el.min || 0,
			max: parseCardinality(el?.max || '1'),
			isRequired: el?.min ? el.min > 0 : false,
			type: type,
			binding: el?.binding || undefined,
			isArray: el.max === '*' || el.max === '-1',
			isMultiCode: isMultiCodeElement(el.path)
		};

		// tree structure of the element can have nested elements
		if (el.element && el.element.length > 0) {
			currentElement.element = transformElement(el.element);
		}

		result.push(currentElement);
	}

	return result;
}

export const normalizeResource = (elements: InternalSchemaElement[] | undefined, resourceState: ElementState = {}, originalState: ElementState = {}) => {
	const resource = {} as Resource;
	if (!elements) {
		return resource;
	}
	// create internal schema state
	for(const nE of elements || []) {
		// array elements
		if (nE.isArray) {
			if(resourceState[nE.name] && Array.isArray(resourceState[nE.name]) && resourceState[nE.name].length > 0){
				resource[nE.name] = resourceState[nE.name];
			}
			continue;
		}
		//implement multi-code elements e.g. Patient.multipleBirth[x] -> Patient.multipleBirthBoolean
		if (nE.isMultiCode) {
			if(resourceState[nE.name] && resourceState[nE.name] !== null && resourceState[nE.name] !== undefined){
				const { code = null, value = null } = resourceState[nE.name];
				if( code !== null && value !== null) {
					const codeAttribute = `${nE.name}${capitalize(code)}`;
					resource[codeAttribute] = value;
				}
			}
			continue;
		}
		// standard elements
		if(resourceState[nE.name] && resourceState[nE.name] !== null && resourceState[nE.name] !== undefined) {
			resource[nE.name] = resourceState[nE.name];
		}
	}

	// handle currently not supported form elements
	for(const oS in originalState) {
		if (originalState.hasOwnProperty(oS)) {
			if (resource[oS] === undefined) {
				resource[oS] = originalState[oS];
			} else if (Array.isArray(resource[oS]) && resource[oS].length === 0) {
				// if the state is an array, merge the default state with the current state
				resource[oS] = [...originalState[oS]];
		}
		}
	}

	return resource;
}


/**
 * Check if element is a multicode-element -> e.g. Patient.multipleBirth[x]
 * @param element - The element to check
 * @returns True if the element is a multicode-element; false otherwise.
 */
function isMultiCodeElement(path: string | undefined): boolean {
	if (!path) {
		return false;
	}
	return path.endsWith('[x]');
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
export const capitalize = <T extends string>(s: T | null) => (
	s? s[0].toUpperCase() + s.slice(1) : null
) as Capitalize<typeof s extends string ? string : T>;

/**
 * Returns the coding type of the given element.
 * Filters supported coding types.
 * @param codingType - The coding type array.
 * @returns The coding type code if present; null otherwise.
 */
function codingType(codingType: ElementType[]): SupportedCodingType | SupportedCodingType[] | null {
	if (codingType.length === 0 || !codingType[0].code) {
		return null;
	}
	// Filter out unsupported coding types
	if (!supportedCodingTypes.includes(codingType[0].code as SupportedCodingType)) {
		return null;
	}
	// if only one coding type is present, return it
	if (codingType.length === 1) {
		return codingType[0].code as SupportedCodingType;
	}
	// if multiple coding types are present, return as array -> only return supported coding types
	return codingType.map((c) => c.code as SupportedCodingType).filter((c) => supportedCodingTypes.includes(c));
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

/**
 * Returns the normalized path, optionally trimmed by a prefix.
 * @param path
 * @param prefix
 * @returns The path of the element, optionally trimmed by a prefix.
 */
function normalizePath(path: string | undefined, prefix = ''): string {
	if (!path) {
		return '';
	}
	const isMultiCode = isMultiCodeElement(path);
	if (isMultiCode) {
		path = path.substring(0, path.length - 3);
	}
	return trimPrefix(path, prefix);
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
	if (!child) {
		return false;
	}
	if (!parent) {
		// If no parent path is provided, all paths are considered compatible
		return true;
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