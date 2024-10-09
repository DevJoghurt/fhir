import type { ComputedRef, Ref } from 'vue'
export type { OperationOutcome } from '@medplum/fhirtypes'
export type { ProfileResource, MedplumClientEventMap } from '@medplum/core';

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