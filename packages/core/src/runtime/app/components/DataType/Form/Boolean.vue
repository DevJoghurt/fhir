<template>
	<div class="flex items-center space-x-4 border border-gray-300 rounded-md py-1 px-2">
		<UCheckbox v-model="boolean" @change="update" label="Select" />
	</div>
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type BooleanType = {
		_id: string
		value: boolean
	} | boolean| null | undefined

	const props = defineProps<{
		modelValue: BooleanType
		element: InternalSchemaElement
	}>()

	const boolean = ref<boolean>(
		typeof props.modelValue === 'boolean'
			? props.modelValue
			: props.modelValue?.value || false
	);

	const emit = defineEmits(['update:modelValue', 'change'])

	const update = () => {
		let result = boolean.value as BooleanType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: boolean.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>