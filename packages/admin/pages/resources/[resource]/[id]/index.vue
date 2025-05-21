<template>
	<div class="p-8">
		<FhirOperationOutcomeAlert v-if="error" :issues="error?.data?.issue" />
		<FhirResourceDetail :view-type="viewType" :resource="resource"  />
	</div>
</template>
<script setup lang="ts">
	import type { ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceId: string
		resourceType: ResourceType
		viewType: 'data' | 'json'
	}>()

	const { readResource } = useFhirClient()

	const { data: resource, error} = await readResource(props.resourceType || 'Basic', props?.resourceId || '')
</script>