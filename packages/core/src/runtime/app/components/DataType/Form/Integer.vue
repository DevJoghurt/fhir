<template>
	<UInputNumber
		name="integer"
		class="w-full"
		v-model="integer"
		@change="update" />
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type IntegerType = {
		_id: string
		value: number
	} | number| null | undefined

	const props = defineProps<{
		modelValue: IntegerType
		element: InternalSchemaElement
	}>()

	const integer = ref<number>(
		typeof props.modelValue === 'number'
			? props.modelValue
			: props.modelValue?.value || 0
	);

	const emit = defineEmits(['update:modelValue', 'change'])

	const update = () => {
		let result = integer.value as IntegerType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: integer.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>