<template>
	<div v-if="value && value.length>0" class="border border-gray-200 rounded-md p-4">
		<div v-for="identifier in value" :key="identifier.value">
			<div>{{ identifier.value }}</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { Identifier } from '@medplum/fhirtypes'

	defineProps<{
		value: Identifier[] | [] | null
	}>()
</script>