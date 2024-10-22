<template>
	<header
	  class="sticky top-0 z-40 bg-background/80 backdrop-blur-lg"
	  :class="{ 'lg:border-b': config.header.border }"
	>
	  <div
		class="flex h-14 items-center justify-between gap-2 px-4 md:px-8"
		:class="{ 'border-b lg:border-none': config.header.border, 'mx-auto max-w-[1536px]': config.main.padded }"
	  >
		<LayoutHeaderLogo class="hidden flex-1 md:flex" />
		<LayoutMobileNav />
		<LayoutHeaderLogo v-if="config.header.showTitleInMobile" class="flex md:hidden" />
		<LayoutHeaderNav class="hidden flex-1 lg:flex" />
		<div class="flex flex-1 justify-end gap-2">
		  <LayoutSearchButton v-if="!config.search.inAside && config.search.style === 'input'" />
		  <div class="flex items-center gap-2">
			<LayoutSearchButton v-if="!config.search.inAside && config.search.style === 'button'" />
			<DarkModeToggle v-if="config.header.darkModeToggle" />
			<NuxtLink
			  v-for="(link, i) in config.header.links"
			  :key="i"
			  :to="link?.to"
			  :target="link?.target"
			>
			  <UButton v-if="link?.icon" variant="ghost" size="sm" :icon="link.icon" />
			</NuxtLink>
		  </div>
		</div>
	  </div>
	  <div v-if="config.toc.enable && config.toc.enableInMobile" class="lg:hidden">
		<LayoutToc is-small />
	  </div>
	</header>
</template>
<script setup lang="ts">
	import { useConfig } from '#imports';

	const config = useConfig();
</script>