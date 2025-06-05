<template>
	<div class="p-8">
		<FhirOperationOutcomeAlert v-if="error" :issues="error" />
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
	import { useFhirClient, useAsyncData } from '#imports'

	const props = defineProps<{
		resourceId: string
		resourceType: ResourceType
		viewType: 'data' | 'json'
		history: string | null
	}>()

	const { readVersion, readResource } = useFhirClient()


	const {data: resource, error} = await useAsyncData('resource-detail', () => {
		if(props.history) {
			return readVersion(props.resourceType, props.resourceId, props.history)
		} else {
			return readResource(props.resourceType, props.resourceId)
		}
	}, {
		watch: [() => props.history]
	})
</script>