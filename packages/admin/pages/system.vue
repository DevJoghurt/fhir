<template>
	<div>
		<div class="bg-gray-50 border-b border-gray-200 flex justify-between px-6 py-4">
			<h1 class="text-xl font-semibold">System</h1>
		</div>
		<div class="flex bg-gray-50 gap-4 items-center px-4">
			<UNavigationMenu
				class="w-full"
				highlight-color="primary"
				orientation="horizontal"
				:items="menu"
			/>
		</div>
		<NuxtPage :page-key="route => route.fullPath" />
	</div>
</template>
<script setup lang="ts">
	import { computed, useRoute } from '#imports'

	const route = useRoute()
	const isBasePath = computed(() => !['profiles'].some(el => route.path.includes(el)))

	const menu = computed(() => [
		[
			{
				label: 'System',
				to: '/system',
				icon: 'heroicons-square-3-stack-3d',
				active: isBasePath.value ? true : false
			},
			{
				label: 'Profiles',
				to: '/system/profiles',
				icon: 'heroicons-clipboard-document-check'
			}
		]
	])
</script>