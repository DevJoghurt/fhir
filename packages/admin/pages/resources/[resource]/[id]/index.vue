<template>
	<h1>{{ resourceType }} : {{ resourceId }}</h1>
</template>
<script setup lang="ts">
	const props = defineProps<{
		resourceId: string
		resourceType: string
	}>()


</script>