import { operationOutcomeIssueToString, operationOutcomeToString } from '../../utils/outcomes'

export function useFhirUtils() {
	return {
		operationOutcomeToString,
		operationOutcomeIssueToString,
	}
}