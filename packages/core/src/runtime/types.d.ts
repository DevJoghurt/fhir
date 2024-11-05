export type { OperationOutcome } from '@medplum/fhirtypes'
import type { ProfileResource } from '@medplum/core';
export type { MedplumClientEventMap } from '@medplum/core';

export interface SecureSessionData {
}

export interface UserSession {
  /**
   * User session data, available on client and server
   */
  profile?: ProfileResource
  /**
   * Private session data, only available on server/ code
   */
  secure?: SecureSessionData
  /**
   * Extra session data, available on client and server
   */
  [key: string]: unknown
}

export interface UserSessionRequired extends UserSession {
	profile: ProfileResource
}