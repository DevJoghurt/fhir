<template>
	<figure ref="root" class="relative">
	  <pre
		ref="codeBlock"
		:class="{
		  'opacity-0': isDiagramLoading
		}"
		v-text="decodedCode"
	  />
	  <div>
		<div v-if="isDiagramLoading" class="absolute inset-0 font-serif">
		  <component :is="spinner" class="mermaid-placeholder__spinner" />
		  Mermaid diagram is loading...
		</div>
	  </div>
	</figure>
</template>
<script setup lang="ts">
//https://github.com/d0rich/esprit/tree/main/packages/nuxt-content-mermaid
import {useNuxtApp, computed, useAppConfig, resolveComponent, ref, onMounted} from '#imports'

const { $mermaid } = useNuxtApp()

const props = defineProps<{
  code: string
}>()

const decodedCode = computed(() => {
  return atob(props.code)
})

const spinner = resolveComponent(useAppConfig().contentMermaid.spinnerComponent)
const codeBlock = ref<HTMLElement | null>(null)
const isDiagramLoading = ref(true)

async function renderMermaidDiagram() {
  isDiagramLoading.value = true
  if (codeBlock.value && $mermaid) {
    try {
      await $mermaid.run({
        nodes: [codeBlock.value],
        suppressErrors: true
      })
    } catch (e) {
      console.warn(e)
    }

    isDiagramLoading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    renderMermaidDiagram()
  }, 100)
})
</script>
<style>
	.mermaid-placeholder__spinner {
		max-height: calc(100% - 2rem);
	}
</style>