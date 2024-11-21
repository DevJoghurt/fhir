import { useState } from '#imports'

type SessionState = {
	accessToken?: string
}

export function useFhir() {
	const sessionState = useState<SessionState>('fhir-session', () => ({}))
	if(!sessionState.value?.accessToken){
		console.warn('No accessToken found in sessionState')
	}

	const accessToken = sessionState.value.accessToken || null


	return {

	}
}