<template>
	<UInput
		name="uri"
		class="w-full"
		v-model="id"
		@change="update"
		/>
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type IdType = {
		_id: string
		value: string
	} | string | null | undefined

	const props = defineProps<{
		modelValue: IdType
		element: InternalSchemaElement
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const id = ref<string>(
		typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue?.value || ''
	);

	const update = () => {
		let result = id.value as IdType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: id.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>