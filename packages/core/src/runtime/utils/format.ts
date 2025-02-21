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

/**
 * Formats the family name portion of a FHIR HumanName element.
 * @param name - The name to format.
 * @returns The formatted family name string.
 */
export function formatFamilyName(name: HumanName): string {
	return ensureString(name.family) ?? '';
  }

  /**
   * Returns true if the given date object is a valid date.
   * Dates can be invalid if created by parsing an invalid string.
   * @param date - A date object.
   * @returns Returns true if the date is a valid date.
   */
  export function isValidDate(date: Date): boolean {
	return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Formats a FHIR date string as a human readable string.
   * Handles missing values and invalid dates.
   * @param date - The date to format.
   * @param locales - Optional locales.
   * @param options - Optional date format options.
   * @returns The formatted date string.
   */
  export function formatDate(
	date: string | undefined,
	locales?: Intl.LocalesArgument,
	options?: Intl.DateTimeFormatOptions
  ): string {
	if (!date) {
	  return '';
	}
	const d = new Date(date);
	if (!isValidDate(d)) {
	  return '';
	}
	d.setUTCHours(0, 0, 0, 0);
	return d.toLocaleDateString(locales, { timeZone: 'UTC', ...options });
  }

  /**
 * Formats a FHIR time string as a human readable string.
 * Handles missing values and invalid dates.
 * @param time - The date to format.
 * @param locales - Optional locales.
 * @param options - Optional time format options.
 * @returns The formatted time string.
 */
export function formatTime(
	time: string | undefined,
	locales?: Intl.LocalesArgument,
	options?: Intl.DateTimeFormatOptions
  ): string {
	if (!time) {
	  return '';
	}
	const d = new Date('2000-01-01T' + time + 'Z');
	if (!isValidDate(d)) {
	  return '';
	}
	return d.toLocaleTimeString(locales, options);
  }

  /**
   * Formats a FHIR dateTime string as a human readable string.
   * Handles missing values and invalid dates.
   * @param dateTime - The dateTime to format.
   * @param locales - Optional locales.
   * @param options - Optional dateTime format options.
   * @returns The formatted dateTime string.
   */
  export function formatDateTime(
	dateTime: string | undefined,
	locales?: Intl.LocalesArgument,
	options?: Intl.DateTimeFormatOptions
  ): string {
	if (!dateTime) {
	  return '';
	}
	const d = new Date(dateTime);
	if (!isValidDate(d)) {
	  return '';
	}
	return d.toLocaleString(locales, options);
  }