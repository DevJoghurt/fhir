<template>
	<UCard :ui="{
		root: 'rounded-none',
		header: 'p-2 bg-gray-100'
	}">
		<template #header>
			<h1 class="text-sm font-bold">Resource History</h1>
		</template>
		<div v-if="error">
			<p>Error loading history: {{ error.message }}</p>
		</div>
		<div v-else-if="!history">
			<p>Loading...</p>
		</div>
		<div v-else class="flex flex-col gap-2 text-xs">
			<div
				class="flex"
				v-for="entry in history?.entry" :key="entry.resource?.id">
				<FhirDateTime class="flex-1" :datetime="entry.resource?.meta?.lastUpdated" />
				<NuxtLink :to="`/resources/${entry.resource?.resourceType}/${entry?.resource?.id}?${stringifyQuery({...route.query, history: entry.resource?.meta?.versionId || ''})}`">#Version {{ entry.resource?.meta?.versionId }}</NuxtLink>
			</div>
		</div>
	</UCard>
</template>
<script lang="ts" setup>
	import { useFhirClient, useRoute } from '#imports';
	import type { ResourceType } from '@medplum/fhirtypes';
	import { stringifyQuery } from 'ufo';

	const props = defineProps<{
		id?: string
		resourceType?: ResourceType
	}>()

	const { readHistory } = useFhirClient()

	const { data: history, error } = await readHistory(props?.resourceType, props?.id || '', {
		query: {
			_count: 20,
			_elements: 'id'
		}
	})
	const route = useRoute()
</script>