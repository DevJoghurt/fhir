<template>
	<UInputMenu
		v-model="transformedValue"
		valueKey="value"
		:items="valueSets"
		:multiple="isArray"
		:loading="status === 'pending'"
		@change="update"
		class="w-full"  />
</template>
<script lang="ts" setup>
	import type {
		ElementDefinitionBinding,
		ValueSet
  	} from '@medplum/fhirtypes';
	import { ref, useFhir } from '#imports';

	const props = defineProps<{
		modelValue?: string,
		isArray?: boolean,
		binding?: ElementDefinitionBinding
	}>()

	const emit = defineEmits(['update:modelValue'])

	const transformedValue = ref(props?.modelValue)

	const { valueSetExpand } = useFhir()

	const { data: valueSets, status } = await valueSetExpand({
		url: props.binding?.valueSet
	}, {
		key: props.binding?.valueSet || '',
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
		emit('update:modelValue', transformedValue.value)
	}

</script>