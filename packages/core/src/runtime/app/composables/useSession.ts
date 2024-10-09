import { useState, computed, useRequestFetch, useNuxtApp, onMounted, onBeforeUnmounted } from '#imports'
import type { UserSession, UserSessionComposable, ProfileResource, MedplumClientEventMap } from '#fhir'

const useSessionState = () => useState<UserSession>('fhir-session', () => ({}));
const useAuthReadyState = () => useState('fhir-auth-ready', () => false);

const EVENTS_TO_TRACK = [
	'change',
	'storageInitialized',
	'storageInitFailed',
	'profileRefreshing',
	'profileRefreshed',
  ] satisfies (keyof MedplumClientEventMap)[];

/**
 * Composable to get back the user session and utils around it.
 * @see https://github.com/atinux/nuxt-auth-utils
 */
export function useUserSession(): UserSessionComposable {
  const sessionState = useSessionState()
  const authReadyState = useAuthReadyState()

  const { $medplum } = useNuxtApp();

  const updateProfile = () : void => {
    sessionState.value.profile = $medplum.getProfile() as ProfileResource;
  };

  updateProfile();

  const registerEvents = async () => {
    onMounted(() => {
			for (const event of EVENTS_TO_TRACK) {
				$medplum.addEventListener(event, updateProfile);
			}
    });
    onBeforeUnmounted(() => {
			for (const event of EVENTS_TO_TRACK) {
				$medplum.addEventListener(event, updateProfile);
			}
    });
  }

  return {
    ready: computed(() => authReadyState.value),
    loggedIn: computed(() => Boolean(sessionState.value.profile)),
    profile: computed(() => sessionState.value.profile as ProfileResource || null),
    session: sessionState,
    fetch,
    clear,
    updateProfile,
    registerEvents
  }
}

async function fetch() {
  const authReadyState = useAuthReadyState()
  useSessionState().value = await useRequestFetch()('/api/_auth/session', {
    headers: {
      Accept: 'text/json',
    },
    retry: false,
  }).catch(() => ({}))
  if (!authReadyState.value) {
    authReadyState.value = true
  }
}

async function clear() {
  await $fetch('/api/_auth/session', { method: 'DELETE' })
  useSessionState().value = {}
}