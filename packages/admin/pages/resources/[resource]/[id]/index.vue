<template>
	<div class="p-8">
		<FhirResourceDetail :type="resourceType" :id="resourceId" />
	</div>
</template>
<script setup lang="ts">
	import type { ResourceType } from '@medplum/fhirtypes'

	defineProps<{
		resourceId: string
		resourceType: ResourceType
	}>()
</script>