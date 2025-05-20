<template>
	<div>{{ formatDateTime(datetime) }}</div>
</template>
<script setup lang="ts">
	import { formatDateTime } from '#imports'

	defineProps<{
		datetime: string
	}>()
</script>