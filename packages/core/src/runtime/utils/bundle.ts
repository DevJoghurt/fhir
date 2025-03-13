import type { BundleEntryResponse } from '@medplum/fhirtypes';
import { normalizeOutcome, type OutcomeNormalized } from './outcomes';

export type BundleResponseNormalized = {
	status: number
	location?: string
	outcome: OutcomeNormalized
};

export function getBundleStatus(response: BundleEntryResponse): number {
	switch (response?.status) {
		case '200 OK':
			return 200;
		case '201 Created':
			return 201;
		case '204 No Content':
			return 204;
		case '400 Bad Request':
			return 400;
		case '401 Unauthorized':
			return 401;
		case '403 Forbidden':
			return 403;
		case '404 Not Found':
			return 404;
		case '409 Conflict':
			return 409;
		default:
			return 500;
	}
}

export function normalizeBundleResponse(response?: BundleEntryResponse): BundleResponseNormalized {
	if(!response) {
		return {
			status: 500,
			outcome: {
				code: 'exception',
				diagnostics: 'No response',
				expression: ['No response'],
				severity: 'error',
				details: 'No response'
			}
		}
	}
	return {
		status: getBundleStatus(response),
		location: response?.location,
		outcome: normalizeOutcome(response?.outcome)
	}
}
