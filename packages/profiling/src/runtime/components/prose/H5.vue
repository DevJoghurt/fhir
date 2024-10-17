<template>
	<h5 :id class="scroll-m-20 text-lg font-semibold tracking-tight [&:not(:first-child)]:mt-6">
	  <NuxtLink
		v-if="id && generate"
		:href="`#${id}`"
	  >
		<slot />
	  </NuxtLink>
	  <slot v-else />
	</h5>
</template>
<script setup lang="ts">
import { computed, useRuntimeConfig } from '#imports'

const props = defineProps<{ id?: string }>()

const { headings } = useRuntimeConfig().public.mdc
const generate = computed(() => props.id && ((typeof headings?.anchorLinks === 'boolean' && headings?.anchorLinks === true) || (typeof headings?.anchorLinks === 'object' && headings?.anchorLinks?.h5)))
</script>