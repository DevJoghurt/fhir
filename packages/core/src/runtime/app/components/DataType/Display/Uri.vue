<template>
	<div>{{ uri }}</div>
</template>
<script setup lang="ts">
	import { ref } from '#imports'

	const props = defineProps<{
		value: Array | string | null
	}>()

	const uri = ref(props.value)
	if (Array.isArray(uri.value)) {
		uri.value = uri.value.join(', ')
	} else if (uri.value === null) {
		uri.value = ''
	}

</script>