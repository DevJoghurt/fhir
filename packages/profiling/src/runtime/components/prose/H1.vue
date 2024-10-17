<template>
	<h1 :id class="scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl">
	  <NuxtLink
		v-if="generate"
		:href="`#${id}`"
	  >
		<slot />
	  </NuxtLink>
	  <slot v-else />
	</h1>
</template>
<script setup lang="ts">
  import { computed, useRuntimeConfig } from '#imports'

  const props = defineProps<{ id?: string }>()

  const { headings } = useRuntimeConfig().public.mdc
  const generate = computed(() => props.id && ((typeof headings?.anchorLinks === 'boolean' && headings?.anchorLinks === true) || (typeof headings?.anchorLinks === 'object' && headings?.anchorLinks?.h1)))
</script>