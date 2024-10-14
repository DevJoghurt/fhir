<template>
	<div class="p-4">
		<ContentQuery path="/docs/resources/structuredefinition-researchstudy">
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
						<ResourceTree v-if="currentTab==='1'" type="differential" :resource="data[0]" />
						<ResourceTree v-if="currentTab==='2'" type="snapshot" :resource="data[0]" />
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
	import { ref, watch } from '#imports';

	const tabs = [
		{ label: 'Sum.', slot: 'summary' },
		{ label: 'Dif.', slot: 'differential-table' },
		{ label: 'Snap.', slot: 'snapshot-table' },
		{ label: 'Snap. (Must)', slot: 'snapshot-table-must' },
	];

	const currentTab = ref(null);

	watch(currentTab, () => {
		console.log('Current tab:', currentTab.value);
	});
</script>