<template>
	<div class="space-x-1">
		<div v-if="element.isSummary" class="inline p-0.5 border-1 rounded-sm bg-gray-100">Σ</div>
		<div v-if="element.isModifier" class="inline p-0.5 border-1 rounded-sm bg-gray-100">?!</div>
		<div v-if="element.mustSupport" class="inline p-0.5 border-1 rounded-sm bg-red-100">S</div>
	</div>
</template>
<script lang="ts" setup>
	import type { PropType } from '#imports'
	import { ElementDefinition } from '@medplum/fhirtypes'

	defineProps({
		element: Object as PropType<ElementDefinition>,
	})
</script>