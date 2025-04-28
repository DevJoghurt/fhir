<template>
	<section class="flex h-16 flex-col h-full w-full bg-white dark:bg-gray-900">
		<div class="flex w-full bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4 space-x-4 items-center">
			<ULink to="/system/packages">
				<UButton icon="heroicons-chevron-left" variant="ghost">Back</UButton>
			</ULink>
			<h1 class="text-xl font-semibold">{{ packageIdentifier }}</h1>
		</div>
		<div class="flex flex-col md:flex-row gap-4 w-full">
			<div class="flex flex-col w-full md:w-2/3 border-r border-gray-200 dark:border-gray-700">
				<div class="sticky top-0 bg-white dark:bg-gray-900 z-10">
					<div class="flex flex-col w-full p-6 space-y-2">
						<h2 class="text-lg font-semibold">Package Name</h2>
						<p class="text-sm text-gray-500 dark:text-gray-400">{{ pkg?.meta?.name }}</p>
					</div>
					<div class="flex px-2 border-b border-gray-200 dark:border-gray-700">
						<UTabs v-model="tabValue" :items="items" color="neutral" variant="link" :content="false" size="md" />
					</div>
				</div>
				<div>
					<ul>
						<li v-for="(file, index) in packageFiles" :key="index" class="flex flex-col gap-2 px-4 py-4 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
							<div class="flex items-center gap-2">
								<UBadge v-if="file?.status?.type === 'loaded'" size="sm">Loaded</UBadge>
								<UBadge v-if="file?.status?.type === 'installed'" color="success" size="sm">Installed</UBadge>
								<UBadge v-if="file?.status?.type === 'failed'" color="error" size="sm">Failed</UBadge>
								<span class="text-sm font-medium text-gray-900 dark:text-white">{{ file.name || file.id }}</span>
							</div>
							<div v-if="file?.status?.type === 'failed'">
								<span class="text-xs text-gray-500 dark:text-gray-400">{{ operationOutcomeToString(file?.status?.message) }}</span>
							</div>
							<div>
								<span class="text-xs text-gray-500 dark:text-gray-400">Path: {{ file.path }}</span>
							</div>
						</li>
					</ul>
				</div>
			</div>
			<div class="w-1/3">
				<div class="md:sticky md:top-0 bg-white dark:bg-gray-900 z-10">
					<div class="flex flex-col w-full p-6 space-y-2">
						<h2 class="text-lg font-semibold">Package Details</h2>
						<p class="text-sm text-gray-500 dark:text-gray-400">Identifier: {{ pkg?.identifier }}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Version: {{ pkg?.meta?.version }}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Author: {{ pkg?.meta?.author }}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Description: {{ pkg?.meta?.description }}</p>
					</div>
					<div class="flex flex-col w-full p-6 space-y-2">
						<h2 class="text-lg font-semibold">Dependencies</h2>
						<ul class="list-disc list-inside text-sm text-gray-500 dark:text-gray-400">
							<li v-for="(value, key) in pkg?.meta?.dependencies" :key="key">{{ key }}: {{ value }}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
<script setup lang="ts">
	import type { TabsItem } from '@nuxt/ui'
	import { useFhirUtils } from '#imports'

	const items = ref<TabsItem[]>([
	{
		label: 'Profile',
		value: 'profile'
	},
	{
		label: 'CodeSystem',
		value: 'codeSystem'
	},
	{
		label: 'ValueSet',
		value: 'valueSet'
	},
	{
		label: 'Extension',
		value: 'extension'
	},
	{
		label: 'SearchParameter',
		value: 'searchParameter'
	},
	{
		label: 'Example',
		value: 'example'
	}
	])
	const route = useRoute()

	const { operationOutcomeToString } = useFhirUtils()

	const packageIdentifier = ref<string | null>(route.params.package as string)

	console.log(packageIdentifier.value)

	const { data: pkg } = await useFetch(`/api/fhir/packages/${encodeURIComponent(packageIdentifier.value || '')}`, {
		query: {
			columns: ['identifier', 'status', 'meta', 'files'],
		}
	})

	const tabValue = ref<string | null>('profile')

	const packageFiles = computed(() => {
		return pkg.value?.files?.filter((file: any) => file.type === tabValue.value)
	})
</script>