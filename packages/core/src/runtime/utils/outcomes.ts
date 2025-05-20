// cc: https://github.com/medplum/medplum/blob/main/packages/core/src/outcomes.ts
import type { OperationOutcome, OperationOutcomeIssue } from '@medplum/fhirtypes';

export interface Constraint {
	key: string;
	severity: 'error' | 'warning';
	expression: string;
	description: string;
  }


const OK_ID = 'ok';
const CREATED_ID = 'created';
const GONE_ID = 'gone';
const NOT_MODIFIED_ID = 'not-modified';
const NOT_FOUND_ID = 'not-found';
const CONFLICT_ID = 'conflict';
const UNAUTHORIZED_ID = 'unauthorized';
const FORBIDDEN_ID = 'forbidden';
const PRECONDITION_FAILED_ID = 'precondition-failed';
const MULTIPLE_MATCHES_ID = 'multiple-matches';
const TOO_MANY_REQUESTS_ID = 'too-many-requests';
const ACCEPTED_ID = 'accepted';
const SERVER_TIMEOUT_ID = 'server-timeout';


export function isOperationOutcome(value: unknown): value is OperationOutcome {
  return typeof value === 'object' && value !== null && (value as any).resourceType === 'OperationOutcome';
}

export function isOk(outcome: OperationOutcome): boolean {
  return (
    outcome.id === OK_ID || outcome.id === CREATED_ID || outcome.id === NOT_MODIFIED_ID || outcome.id === ACCEPTED_ID
  );
}

export function isCreated(outcome: OperationOutcome): boolean {
  return outcome.id === CREATED_ID;
}

export function isAccepted(outcome: OperationOutcome): boolean {
  return outcome.id === ACCEPTED_ID;
}

export function isNotFound(outcome: OperationOutcome): boolean {
  return outcome.id === NOT_FOUND_ID;
}

export function isConflict(outcome: OperationOutcome): boolean {
  return outcome.id === CONFLICT_ID;
}

export function isGone(outcome: OperationOutcome): boolean {
  return outcome.id === GONE_ID;
}

export function isUnauthenticated(outcome: OperationOutcome): boolean {
  return outcome.id === UNAUTHORIZED_ID;
}

export function getOutcomeStatus(outcome: OperationOutcome): number {
    if(outcome.id){
      switch (outcome.id) {
        case OK_ID:
          return 200;
        case CREATED_ID:
          return 201;
        case ACCEPTED_ID:
          return 202;
        case NOT_MODIFIED_ID:
          return 304;
        case UNAUTHORIZED_ID:
          return 401;
        case FORBIDDEN_ID:
          return 403;
        case NOT_FOUND_ID:
          return 404;
        case CONFLICT_ID:
          return 409;
        case GONE_ID:
          return 410;
        case PRECONDITION_FAILED_ID:
        case MULTIPLE_MATCHES_ID:
          return 412;
        case TOO_MANY_REQUESTS_ID:
          return 429;
        case SERVER_TIMEOUT_ID:
          return 504;
        default:
          return outcome.issue?.[0]?.code === 'exception' ? 500 : 400;
      }
    }
    return 200;
}


/**
 * Normalizes an error object into a displayable error string.
 * @param error - The error value which could be a string, Error, OperationOutcome, or other unknown type.
 * @returns A display string for the error.
 */
export function normalizeErrorString(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (isOperationOutcome(error)) {
    return operationOutcomeToString(error);
  }
  if (typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return JSON.stringify(error);
}

/**
 * Returns a string represenation of the operation outcome.
 * @param outcome - The operation outcome.
 * @returns The string representation of the operation outcome.
 */
export function operationOutcomeToString(outcome: OperationOutcome): string {
  const strs = outcome.issue?.map(operationOutcomeIssueToString) ?? [];
  return strs.length > 0 ? strs.join('; ') : 'Unknown error';
}

/**
 * Returns a string represenation of the operation outcome issue.
 * @param issue - The operation outcome issue.
 * @returns The string representation of the operation outcome issue.
 */
export function operationOutcomeIssueToString(issue: OperationOutcomeIssue): string {
  let issueStr;
  if (issue.details?.text) {
    if (issue.diagnostics) {
      issueStr = `${issue.details.text} (${issue.diagnostics})`;
    } else {
      issueStr = issue.details.text;
    }
  } else if (issue.diagnostics) {
    issueStr = issue.diagnostics;
  } else {
    issueStr = 'Unknown error';
  }
  if (issue.expression?.length) {
    issueStr += ` (${issue.expression.join(', ')})`;
  }
  return issueStr;
}

export type OutcomeNormalized = {
  severity: string;
  code: string;
  details: string;
  diagnostics: string;
  expression: string[];
};

/**
 * WIP - Normalize outcome to have a consistent structure.
 * This functions should work with tested Fhir server responses.
 * @param outcome
 * @returns OutcomeNormalized
 */

/**
 * HAPI FHIR Server response example:
 * @param outcome {
          "resourceType": "OperationOutcome",
          "issue": [
            {
              "severity": "information",
              "code": "informational",
              "details": {
                "coding": [
                  {
                    "system": "https://hapifhir.io/fhir/CodeSystem/hapi-fhir-storage-response-code",
                    "code": "SUCCESSFUL_CREATE",
                    "display": "Create succeeded."
                  }
                ]
              },
              "diagnostics": "Successfully created resource \"ImplementationGuide/102/_history/1\". Took 128ms."
            }
          ]
        }
 */

export function normalizeOutcome(outcome: OperationOutcome | any): OutcomeNormalized {
  if (!isOperationOutcome(outcome)) {
    throw new Error('Invalid OperationOutcome');
  }
  const issue = outcome.issue?.[0];
  if (!issue) {
    throw new Error('Invalid OperationOutcome');
  }
  return {
    severity: issue.severity,
    code: issue.code,
    details: issue.details?.text || '',
    diagnostics: issue.diagnostics || '',
    expression: issue.expression || [],
  }
}