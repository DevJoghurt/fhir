<template>
	<UInputNumber
		name="integer"
		class="w-full"
		v-model="unsignedInt"
		@change="update" />
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type UnsignedIntType = {
		_id: string
		value: number
	} | number | null | undefined

	const props = defineProps<{
		modelValue: UnsignedIntType
		element: InternalSchemaElement
	}>()

	const unsignedInt = ref<number>(
		typeof props.modelValue === 'number'
			? props.modelValue
			: props.modelValue?.value || 0
	);

	const emit = defineEmits(['update:modelValue', 'change'])

	const update = () => {
		let result = unsignedInt.value as UnsignedIntType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: unsignedInt.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>