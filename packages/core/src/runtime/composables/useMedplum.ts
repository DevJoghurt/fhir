import type { MedplumClient, ProfileResource, MedplumClientEventMap, LoginAuthenticationResponse } from '@medplum/core';
import {
	normalizeOperationOutcome,
  } from '@medplum/core';
import type { OperationOutcome } from '@medplum/fhirtypes';
import { useNuxtApp, callOnce, onMounted, reactive, toRefs, type Ref } from '#imports';

type LoginReturn = Promise<{
	credentials: LoginAuthenticationResponse | null;
	error: OperationOutcome | null;
}>

export interface MedplumContext {
	medplum: MedplumClient;
	profile: Ref<ProfileResource>;
	loading: Ref<boolean>;
	login: (email: string, password: string) => LoginReturn;
}

const EVENTS_TO_TRACK = [
	'change',
	'storageInitialized',
	'storageInitFailed',
	'profileRefreshing',
	'profileRefreshed',
  ] satisfies (keyof MedplumClientEventMap)[];


export function useMedplum(medplum?: MedplumClient) : MedplumContext {
	let client = medplum;
	if (!client) {
		const { $medplum } = useNuxtApp();
		client = $medplum;
	}
	if (!client) {
		throw new Error('Medplum client not found');
	}

	const medplumState = reactive({
		profile: client.getProfile() as ProfileResource,
		loading: client.isLoading()
	});

	const login = async (email: string, password: string) : LoginReturn => {
		let credentials = null as LoginAuthenticationResponse | null
		let error = null as OperationOutcome | null
		try {
            credentials = await client.startLogin({
				email,
				password

            })
        } catch (err) {
            error = normalizeOperationOutcome(err)
        }

		return { credentials, error }
	}

	//Add event listener only client side and only once
	// TODO: Check if this is the right way to do it -
	// could be that we need to remove the event listener on unmount for each initial use of the composable
	onMounted(() => {
		callOnce(() => {
			const eventListener = () : void => {
				medplumState.profile = client.getProfile() as ProfileResource
				medplumState.loading = client.isLoading();
			};

			for (const event of EVENTS_TO_TRACK) {
				client.addEventListener(event, eventListener);
			}
		});
	});
	return {
		medplum: client,
		login,
		...toRefs(medplumState)
	};
}