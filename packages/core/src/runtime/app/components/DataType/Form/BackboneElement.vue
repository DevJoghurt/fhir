<template>
	<UFormField
		v-for="(el, index) in nestedElements"
		:key="el.path"
		:label="el.label"
		:name="el.name"
		:required="el.isRequired"
		:description="el.description"
		size="sm"
		>
		<!-- If the element is an array, render a list of elements -->
		<FhirDataTypeFormHelperArray
			v-if="el.isArray"
				v-model="state[el.name]"
				@change="update"
				:element="el" />
		<!-- If the element is a multiCode element, render a select and the appropriate form items -->
		<FhirDataTypeFormHelperMultiCode
			v-else-if="el.isMultiCode && Array.isArray(el.type)"
				v-model="state[el.name]"
				@change="update"
				:element="el" />
		<!-- If the element a BackboneElement, render a BackboneElement -->
		 <FhirDataTypeFormBackboneElement
			v-else-if="el.type === 'BackboneElement'"
				v-model="state[el.name]"
				@change="update"
				:nestedElements="el.element" />
		<!-- If the element is a simple element, render the appropriate form items -->
		<component
			v-else
				:is="`FhirDataTypeForm-${el.type}`"
				v-model="state[el.name]"
				@change="update"
				:element="el" />
	</UFormField>
</template>
<script lang="ts" setup>
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'
	import { normalizeResource } from '../../../composables/useFhirResource'
	import { reactive } from '#imports'

	const props = defineProps<{
		modelValue?: any,
		nestedElements?: InternalSchemaElement[]
	}>()
	const emit = defineEmits(['update:modelValue', 'change'])

	const createElementState = (elements: InternalSchemaElement[], state: Record<string, any>) => {
		const generatedState = state || {} as Record<string, any>
		for (const element of elements) {
			// Arrays
			if (element.isArray) {
				generatedState[element.name] = state[element.name] || [];
			}
			// simple element
			else {
				generatedState[element.name] = state[element.name] || null;
			}
		}
		return reactive(generatedState)
	}

	const state = createElementState(props.nestedElements || [], props.modelValue)

	const update = () => {
		const resource = normalizeResource(props.nestedElements, state)
		emit('update:modelValue', resource)
		emit('change', resource)
	}
</script>