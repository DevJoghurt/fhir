<template>
	<UButton variant="ghost" size="sm" :icon="icon" @click="toggleDark">
		<span class="sr-only">Toggle theme</span>
	</UButton>
</template>
<script setup lang="ts">
	import { useColorMode, computed } from '#imports';

	const colorMode = useColorMode();

	let icon = computed<string>(() => colorMode.value === 'light' ? 'lucide:sun' : 'lucide:moon');

	function toggleDark() {
		colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
	}
</script>