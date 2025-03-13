import type {
	ElementDefinition
  } from '@medplum/fhirtypes';

  export interface TypedValue {
	readonly type: string;
	readonly value: any;
  }


/**
 * Credits medplum
 * Based on https://github.com/medplum/medplum/blob/main/packages/core/src/types.ts#L246
 * Returns the type name for an ElementDefinition.
 * @param elementDefinition - The element definition.
 * @returns The Medplum type name.
 */
export function getElementDefinitionTypeName(elementDefinition: ElementDefinition): string {
	const code = elementDefinition.type?.[0]?.code as string;
	return code === 'BackboneElement' || code === 'Element'
	  ? buildTypeName((elementDefinition.base?.path ?? elementDefinition.path)?.split('.') as string[])
	  : code;
}

export function buildTypeName(components: string[]): string {
	if (components.length === 1) {
	  return components[0];
	}
	return components.map(capitalize).join('');
}

export function capitalize(word: string): string {
	if (!word) {
	  return '';
	}
	return word.charAt(0).toUpperCase() + word.substring(1);
}