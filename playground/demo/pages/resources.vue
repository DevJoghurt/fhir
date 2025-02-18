<template>
	<section class="p-8">
		<div class="mb-4">
			<FhirResourceSelect v-model="resourceType" @change="updateResource" />
		</div>
		<FhirResourceTable :key="resourceType || ''" :resource-type="resourceType" />
	</section>
</template>
<script setup lang="ts">
	import type { FhirResource } from '#fhir/types'

	const resourceType = ref<FhirResource | null>('Patient')

	const updateResource = (resource: FhirResource) => {
		resourceType.value = resource
	}
</script>