<template>
	<UCheckbox v-model="value" />
</template>
<script setup lang="ts">
	import { ref } from '#imports'

	const value = ref<boolean>(false)
</script>