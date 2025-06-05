<template>
	<NuxtTime
		:datetime="value"
		year="numeric"
		month="numeric"
		day="numeric"
		hour="2-digit"
		minute="2-digit"
		second="2-digit" />
</template>
<script setup lang="ts">
	// This component is used to display a date value in a human-readable format.
	// A FHIR date is a string in the format YYYY-MM-DD, and this component will format it to a local, more human-readable format.
	defineProps<{
		value: string | null
	}>()
</script>