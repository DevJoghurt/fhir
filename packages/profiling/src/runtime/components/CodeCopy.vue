<template>
	<div class="flex">
		<UButton
		  v-if="copied === false"
		  	icon="lucide:copy"
		  	color="neutral"
    		variant="outline"
		  	@click="handleClick"
		/>
		<UButton
		  v-else
		  	icon="lucide:check"
		  	color="neutral"
    		variant="outline"
		/>
	</div>
  </template>

  <script setup lang="ts">
  	import { useClipboard } from '@vueuse/core';
	import { ref, useConfig, useToast } from '#imports';

	const { code } = defineProps<{
		code: string;
	}>();

	const toast = useToast();

	const { copy } = useClipboard({ source: code });
	const copied = ref(false);

	async function handleClick() {
		await copy(code);
		copied.value = true;

		if (useConfig().value.main.codeCopyToast) {
			toast.add({
				description: useConfig().value.main.codeCopyToastText,
			});
		}
	}
  </script>