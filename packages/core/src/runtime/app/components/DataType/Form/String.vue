<template>
	<UInput
		name="uri"
		class="w-full"
		v-model="string"
		@change="update"
		/>
</template>
<script setup lang="ts">
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type StringType = {
		_id: string
		value: string
	} | string | null | undefined

	const emit = defineEmits(['update:modelValue', 'change'])

	const props = defineProps<{
		modelValue: StringType
		element: InternalSchemaElement
	}>()

	const string = ref<string>(
		typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue?.value || ''
	);

	const update = () => {
		let result = string.value as StringType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: string.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}
</script>