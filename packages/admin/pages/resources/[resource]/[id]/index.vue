<template>
	<div class="p-8">
		<FhirOperationOutcomeAlert v-if="error" :issues="error?.data?.issue" />
		<div class="flex flex-row gap-4">
			<div class="flex-1">
				<FhirResourceDetail :view-type="viewType" :resource="resource"  />
			</div>
			<div class="flex flex-col w-2/5 gap-2">
				<FhirResourceMeta :resource="resource" />
				<FhirResourceHistory :resource-type="resource?.resourceType" :id="resource?.id" />
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { ResourceType } from '@medplum/fhirtypes'
	import { useFhirClient, useFetch, computed, watch } from '#imports'

	const props = defineProps<{
		resourceId: string
		resourceType: ResourceType
		viewType: 'data' | 'json'
		history: string | null
	}>()

	const { getConfig } = useFhirClient()

	const uri = computed(() => {
		const u = [props.resourceType || 'Basic', props?.resourceId || '']
		if(props.history) {
			// If the history query parameter is present, append it to the resource ID
			u.push('_history')
			u.push(props.history.toString())
		}
		return 'fhir/' + u.join('/')
	})

	const { data: resource, error} = await useFetch(uri, {
		baseURL: getConfig().serverUrl,
		deep: false,
		immediate: true,
		watch: [uri],

	})
</script>