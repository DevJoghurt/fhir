<template>
	<USelectMenu
		v-model="resourceType"
		@change="emitResourceType"
		:items="items"
		class="min-w-48" />
</template>
<script setup lang="ts">
	import { onMounted, ref, fhirResourceList } from '#imports'
	import type { FhirResource } from '../../types'

	const emit = defineEmits<{
		(event: 'update:modelValue', value: FhirResource): void
		(event: 'change', value: FhirResource): void
	}>()

	const props =defineProps<{
		default?: FhirResource
	}>()

	const items = fhirResourceList.map((resource: FhirResource) => resource)

	const resourceType = ref<FhirResource>(props?.default || 'Patient')

	/**
	 * Emit the selected resource type
	 * @param value - The selected resource type
	 */
	const emitResourceType = () => {
		emit('update:modelValue', resourceType.value)
		emit('change', resourceType.value)
	}

	onMounted(() => {
		emitResourceType()
	})
</script>