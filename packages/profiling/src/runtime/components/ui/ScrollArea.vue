<template>
	<ScrollAreaRoot v-bind="delegatedProps" :class="scrollAreaRoot({
		class: props.class
	})">
	  <ScrollAreaViewport class="size-full rounded-[inherit]">
		<slot />
	  </ScrollAreaViewport>
	  <UiScrollBar />
	  <ScrollAreaCorner />
	</ScrollAreaRoot>
  </template>

  <script setup lang="ts">
	import { tv } from 'tailwind-variants';
	import {
		ScrollAreaCorner,
		ScrollAreaRoot,
		type ScrollAreaRootProps,
		ScrollAreaViewport,
	} from 'radix-vue';
	import { computed, type HTMLAttributes } from 'vue';

	const props = defineProps<ScrollAreaRootProps & { class?: HTMLAttributes['class'] }>();

	const delegatedProps = computed(() => {
		const { class: _, ...delegated } = props;

		return delegated;
	});

	const scrollAreaRoot = tv({
		base: 'relative overflow-hidden'
	});
</script>