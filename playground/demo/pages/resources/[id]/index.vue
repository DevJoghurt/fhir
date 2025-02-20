<template>
	<section>
		<FhirQueryResourceTable :key="resourceType || ''" :resource-type="resourceType" />
	</section>
</template>
<script setup lang="ts">
	import type { FhirResource } from '#fhir/types'

	defineProps<{
		resourceType: FhirResource
	}>()
</script>