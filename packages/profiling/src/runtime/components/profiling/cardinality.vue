<template>
	<div>
		<span> {{ element.min }} .. {{ element?.max || '' }} </span>
	</div>
</template>
<script setup lang="ts">
	import type { PropType } from '#imports'
	import { ElementDefinition } from '@medplum/fhirtypes'

	defineProps({
		element: Object as PropType<ElementDefinition>,
	})
</script>