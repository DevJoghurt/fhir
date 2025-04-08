<template>
	<div class="flex space-x-4">
		<USelect v-model="selectedCodeType" :items="element.type" class="w-64" />
		<component
			v-if="selectedCodeType"
			:key="selectedCodeType"
			:is="`FhirDataTypeForm-${selectedCodeType}`"
			v-model="elementValue"
			@change="update"
			:element="element"
		/>
	</div>
</template>
<script lang="ts" setup>
	import type { InternalSchemaElement } from '../../../../composables/useFhirResource'
	import { ref } from '#imports'

	const props = defineProps<{
		modelValue?: any,
		element: InternalSchemaElement
	}>()
	const emit = defineEmits(['update:modelValue', 'change'])

	const elementValue = ref(props.modelValue)

	// create default value for selectedCodeType
	let defaultCodeType = null
	if (props.element.type.length > 0) {
		defaultCodeType = props.element.type[0]
	}
	const selectedCodeType = ref(defaultCodeType)

	const update = () => {
		const value = {
			code: selectedCodeType.value,
			value: elementValue.value
		}
		emit('update:modelValue', value)
		emit('change', value, props.element)
	}
</script>