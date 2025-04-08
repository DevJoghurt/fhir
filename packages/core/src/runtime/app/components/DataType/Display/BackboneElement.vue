<template>
	<ul>
		<li
			v-for="(el, index) in nestedElements"
			:key="el.path"
			>
			<div v-if="el" class="border-b border-gray-200 p-4">
				<label class="text-sm font-medium">{{ el.label }}</label>
				<div class="text-xs hidden">
					{{ el.description }}
				</div>
				<!-- If the element a BackboneElement, render a BackboneElement -->
				<FhirDataTypeDisplayBackboneElement
					v-if="el.type === 'BackboneElement'"
						:resource="resource"
						:nestedElements="el.element" />
				<div
					v-else-if="el.isMultiCode && Array.isArray(el.type)"
						:value="resource[el.name] || null"
						:element="el" />
				<!-- If the element is a simple element, render the appropriate form items -->
				<component
					v-else
						:is="`FhirDataTypeDisplay-${el.type}`"
						:value="resource[el.name] || null"
						:element="el" />
			</div>
		</li>
	</ul>
</template>
<script setup lang="ts">
	// This component is used to display a BackboneElement in a human-readable format.
	import type { Resource } from '@medplum/fhirtypes';
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	defineProps<{
		resource: Resource
		nestedElements?: InternalSchemaElement[]
	}>()


</script>
