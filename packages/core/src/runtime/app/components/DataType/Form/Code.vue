<template>
	<UInputMenu
		v-model="transformedValue"
		valueKey="value"
		:items="valueSets"
		:multiple="element?.isArray"
		:loading="loading"
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

	const { valueSetExpand, loading } = useFhirClient()

	// TODO: Cache data
	const valueSetsResponse = await valueSetExpand({
		url: props?.element.binding?.valueSet
	})
	// ValueSet expansions can have the data in compose.include or expansion.contains
	// https://www.hl7.org/fhir/valueset-expansion.html#ValueSet.expansion
	const transform = (data: ValueSet) => {
		// first check if the data is in compose.include
		if (data?.compose?.include && data?.compose?.include.length > 0) {
			// check if there are concepts in the first include
			if(data?.compose?.include[0]?.concept) {
				// if there are data, return the concepts
				return data?.compose?.include?.flatMap(include => include?.concept)?.map(valueSet => ({
					label: valueSet?.display || valueSet?.code || '',
					value: valueSet?.code || '',
					system: valueSet?.system || ''
				})) || []
			}
		}

		// if not, check if the data is in expansion.contains
		return data?.expansion?.contains?.map(valueSet => ({
			label: valueSet?.display || valueSet?.code || '',
			value: valueSet?.code || '',
			system: valueSet?.system || ''
		})) || []
	}

	const valueSets = transform(valueSetsResponse as ValueSet)

	console.log('ValueSets:', valueSets)

	const update = () => {
		let result = transformedValue.value as CodeType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: transformedValue.value }
		}
		emit('update:modelValue', result)
		emit('change', result, props.element)
	}

</script>