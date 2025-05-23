<template>
	<div
		v-if="!page?.body"
		class="flex h-full items-center justify-center"
		>
		<h3 class="scroll-m-20 border-r px-4 py-3 text-2xl font-semibold">
			404
		</h3>
		<span class="scroll-m-20 px-4">
			This page could not be found.
		</span>
	</div>

	<main v-else
		class="relative py-6"
		:class="[config.toc.enable  && (page.toc ?? true) && 'lg:grid lg:grid-cols-[1fr_200px] lg:gap-10 lg:py-8']">

		<div class="mx-auto w-full min-w-0">
			<LayoutBreadcrumb v-if="page?.body && config.main.breadCrumb" class="mb-4" />

			<div v-if="config.main.showTitle" class="mb-6 space-y-2">
				<ProseH1>
					{{ page?.title }}
				</ProseH1>
				<p class="text-lg text-muted-foreground">
					{{ page?.description }}
				</p>
			</div>

			<UAlert
				v-if="page?.body?.children?.length === 0"
				title="Empty Page"
				icon="lucide:circle-x"
			>
				Start writing in <ProseCodeInline>content/{{ page?._file }}</ProseCodeInline> to see this page taking shape.
			</UAlert>

			<ContentRenderer
				v-else
				:key="page._id"
				:value="page"
				class="docs-content"
			/>

			<LayoutPrevNext />
		</div>
		<div v-if="config.toc.enable" class="hidden text-sm lg:block">
			<div class="sticky top-[90px] h-[calc(100vh-3.5rem)] overflow-hidden">
				<LayoutToc :is-small="false" />
			</div>
		</div>
	</main>
</template>
<script setup lang="ts">
	import { useContent, useConfig, useSeoMeta } from '#imports';

	const { page } = useContent();
	const config = useConfig();

	useSeoMeta({
		title: `${page.value?.title ?? '404'} - ${config.value.site.name}`
	});
</script>
<style>
	@import "tailwindcss";
	@import "@nuxt/ui";
</style>