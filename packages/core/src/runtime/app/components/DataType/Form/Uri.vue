<template>
	<UInput
		name="uri"
		class="w-full"
		v-model="uri"
		@change="update"
		/>
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type UriType = {
		_id: string
		value: string
	} | string | null | undefined

	const props = defineProps<{
		modelValue: UriType,
		element: InternalSchemaElement
	}>()

	const uri = ref<string>(
		typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue?.value || ''
	);

	const emit = defineEmits(['update:modelValue', 'change'])
	//TODO validate URI
	const update = () => {
		let result = uri.value as UriType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: uri.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>