<template>
	<div>
		<span> {{ element.min }} .. {{ element?.max || '' }} </span>
	</div>
</template>
<script setup lang="ts">
	import { defineProps, PropType } from 'vue'
	import { ElementDefinition } from '@medplum/fhirtypes'

	defineProps({
		element: Object as PropType<ElementDefinition>,
	})
</script>