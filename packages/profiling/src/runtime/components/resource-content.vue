<template>
	<div class="p-4">
		<ContentQuery :path="`/profiling/${resource}`">
			<template #default="{ data }">
				<UCard>
					<template #header>
						<h1 class="text-lg font-thin">{{ data[0].id }}</h1>
					</template>
					<div class="flex justify-end px-4">
						<UTabs v-model="currentTab" defaultValue="0" :items="tabs" size="sm" :content="false" class="w-64">
						</UTabs>
					</div>
					<div>
						<ResourceSummary v-if="currentTab==='0'" :resource="data[0]" />
						<ResourceTree v-if="currentTab==='1'" type="differential" :resource="data[0]" />
						<ResourceTree v-if="currentTab==='2'" type="snapshot" :resource="data[0]" />
						<ResourceTree v-if="currentTab==='3'" type="snapshot" filter="mustSupport" :resource="data[0]" />
					</div>
					<template #footer>

					</template>
				</UCard>
			</template>
			<template #not-found>
				<p>No data found.</p>
			</template>
    	</ContentQuery>
	</div>
</template>
<script setup lang="ts">
	import { ref } from '#imports';

	const tabs = [
		{ label: 'Sum.', slot: 'summary' },
		{ label: 'Dif.', slot: 'differential-table' },
		{ label: 'Snap.', slot: 'snapshot-table' },
		{ label: 'Snap. (Must)', slot: 'snapshot-table-must' },
	];

	const currentTab = ref('0');

	defineProps<{
		resource: string;
	}>()
</script>