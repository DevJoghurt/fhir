<template>
	<UInputMenu
		v-model="transformedValue"
		valueKey="value"
		:items="valueSets"
		:multiple="element?.isArray"
		:loading="status === 'pending'"
		@change="update"
		class="w-full"  />
</template>
<script lang="ts" setup>
	import type {
		ValueSet
  	} from '@medplum/fhirtypes';
	import { ref, useFhirClient } from '#imports';
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type CodeType = {
		_id: string
		value: string
	} | string | null | undefined

	const props = defineProps<{
		modelValue?: CodeType,
		element: InternalSchemaElement
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const transformedValue = ref(
		typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue?.value || ''
		)

	const { valueSetExpand } = useFhirClient()

	// TODO: Cache data
	const { data: valueSets, status } = await valueSetExpand({
		url: props?.element.binding?.valueSet
	}, {
		key: props?.element.binding?.valueSet || '',
		transform: (data: ValueSet) => {
			return data?.expansion?.contains?.map(valueSet => ({
				label: valueSet?.display || valueSet?.code || '',
				value: valueSet?.code || '',
				system: valueSet?.system || ''
			}))
		},
		lazy: true
	})

	const update = () => {
		let result = transformedValue.value as CodeType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: transformedValue.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}

</script>