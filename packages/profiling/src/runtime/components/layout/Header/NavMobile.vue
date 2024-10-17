<template>
	<UButton
		v-bind="props"
	>
	  <slot />
	</UButton>
</template>
<script setup lang="ts">
	import { type ButtonProps } from '#ui/components/Button.vue';

	const props = withDefaults(defineProps<ButtonProps>(), {
		variant: 'ghost',
	});
</script>