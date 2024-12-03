import type {
	HumanName
} from '@medplum/fhirtypes';

export interface HumanNameFormatOptions {
	all?: boolean;
	prefix?: boolean;
	suffix?: boolean;
	use?: boolean;
}

/**
 * Ensures the input is a string.
 * While the TypeScript type definitions for FHIR resources are strict, the actual input data can be malformed.
 * We use this method to protect against runtime errors.
 * @param input - The input to ensure is a string.
 * @returns The input as a string, or undefined if not a string.
 */
function ensureString(input: unknown): string | undefined {
	return typeof input === 'string' ? input : undefined;
}

/**
 * Formats a FHIR HumanName as a string.
 * @param name - The name to format.
 * @param options - Optional name format options.
 * @returns The formatted name string.
 */
export function formatHumanName(name?: HumanName, options?: HumanNameFormatOptions): string {
	const builder = [];

	if(!name) {
		return '';
	}

	if (name.prefix && options?.prefix !== false) {
	  builder.push(...name.prefix);
	}

	if (name.given) {
	  builder.push(...name.given);
	}

	if (name.family) {
	  builder.push(name.family);
	}

	if (name.suffix && options?.suffix !== false) {
	  builder.push(...name.suffix);
	}

	if (name.use && (options?.all || options?.use)) {
	  builder.push('[' + name.use + ']');
	}

	if (builder.length === 0) {
	  const textStr = ensureString(name.text);
	  if (textStr) {
		return textStr;
	  }
	}

	return builder.join(' ').trim();
}