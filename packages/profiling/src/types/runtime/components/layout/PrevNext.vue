<template>
	<div class="mt-10 border-t pt-8 lg:flex lg:flex-row">
	  <LayoutPrevNextButton :prev-next="tocPrev" side="left" />
	  <span class="flex-1" />
	  <LayoutPrevNextButton :prev-next="tocNext" side="right" />
	</div>
</template>
<script setup lang="ts">
	import { useContent, computed } from '#imports';

	const { prev, next } = useContent();

	// filter out the hide-toc link -> TODO: make filter configuarble
	const ignoreDirs = ['profiling'];

	const tocNext = computed(() => {
		for(const dir of ignoreDirs) {
			if(next.value && next.value._dir === dir) {
				return null
			}
		}
		return next.value;
	});

	const tocPrev = computed(() => {
		for(const dir of ignoreDirs) {
			if(prev.value && prev.value._dir === dir) {
				return null
			}
		}
		return prev.value;
	});
</script>