<template>
	<UButton variant="ghost" size="sm" :icon="icon" @click="toggleDark" :class="currentClass">
	  <span class="sr-only">Toggle theme</span>
	</UButton>
</template>
<script setup lang="ts">
	import { useColorMode, ref } from '#imports';

	const colorMode = useColorMode();

	const icon = ref<string>('lucide:sun');
	const currentClass = ref<string>('rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0');

	// TODO: rewrite with tailwind variants
	function toggleDark() {
		colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
		switch (colorMode.value) {
			case 'dark':
				icon.value = 'lucide:sun';
				currentClass.value = 'rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0';
				break;
			case 'light':
				icon.value = 'lucide:moon';
				currentClass.value = 'rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100';
				break;
			default:
				break;
		}
	}
</script>