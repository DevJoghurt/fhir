<template>
	<div>{{ value }}</div>
</template>
<script setup lang="ts">
	defineProps<{
		value: boolean | null
	}>()
</script>