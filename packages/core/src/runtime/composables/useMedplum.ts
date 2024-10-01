import type { MedplumClient, ProfileResource, MedplumClientEventMap } from '@medplum/core';
import { useNuxtApp, reactive, toRefs, type Ref } from '#imports';

export interface MedplumContext {
	medplum: MedplumClient;
	profile: Ref<ProfileResource>;
	loading: Ref<boolean>;
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

	const medplumState = reactive({
		profile: client.getProfile() as ProfileResource,
		loading: client.isLoading()
	});

	//TODO: Add event listener only client side and only once



	const eventListener = () : void => {
		medplumState.profile = client.getProfile() as ProfileResource
		medplumState.loading = client.isLoading();
	};

	for (const event of EVENTS_TO_TRACK) {
		client.addEventListener(event, eventListener);
	}

	return {
		medplum: client,
		...toRefs(medplumState)
	};
}