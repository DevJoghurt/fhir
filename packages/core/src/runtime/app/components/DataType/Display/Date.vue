<template>
	<div>{{ formatDate(value || undefined) }}</div>
</template>
<script setup lang="ts">
	import { formatDate } from '../../../../utils'
	// This component is used to display a date value in a human-readable format.
	// A FHIR date is a string in the format YYYY-MM-DD, and this component will format it to a local, more human-readable format.
	defineProps<{
		value: string | null
	}>()
</script>