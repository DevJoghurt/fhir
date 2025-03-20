<template>
	<section>
		<FhirResourceTable @select="onSelect" :key="resourceType || ''" :resource-type="resourceType" />
	</section>
</template>
<script setup lang="ts">
	import type { Resource, ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceType: ResourceType
	}>()

	const onSelect = (resource: Resource) => {
		navigateTo(`/resources/${props.resourceType}/${resource.id}`)
	}
</script>