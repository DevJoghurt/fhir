<template>
	<div>{{ formatDateTime(datetime) }}</div>
</template>
<script setup lang="ts">
	import { formatDateTime } from '../../utils'

	defineProps<{
		datetime: string
	}>()
</script>