<template>
	<ScrollAreaScrollbar
	  v-bind="delegatedProps"
	  :class="scrollAreaScrollbar({
		orientation: orientation,
		class: props.class
	  })"
	>
	  <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
	</ScrollAreaScrollbar>
</template>
<script setup lang="ts">
	import { tv } from 'tailwind-variants';
	import { ScrollAreaScrollbar, type ScrollAreaScrollbarProps, ScrollAreaThumb } from 'radix-vue';
	import { computed, type HTMLAttributes } from 'vue';

	const props = withDefaults(defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }>(), {
		orientation: 'vertical',
	});

	const delegatedProps = computed(() => {
		const { class: _, ...delegated } = props;

		return delegated;
	});

  	const scrollAreaScrollbar = tv({
		base: 'flex touch-none select-none transition-colors',
		variants: {
			orientation: {
				vertical: 'h-full w-2.5 border-l border-l-transparent p-px',
				horizontal: 'h-2.5 flex-col border-t border-t-transparent p-px'
			}
  		}
	});
</script>