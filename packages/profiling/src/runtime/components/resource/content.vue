<template>
	<div class="py-4">
		<UCard v-if="data && !error">
			<template #header>
				<div class="flex justify-between">
					<h1 class="text-lg font-thin">{{ data.id }}</h1>
					<UTabs v-model="currentTab" defaultValue="0" :items="tabs" size="sm" :content="false" class="w-64">
					</UTabs>
				</div>
			</template>
			<div>
				<ResourceSummary v-if="currentTab==='0'" :resource="data" />
				<ResourceTree v-if="currentTab==='1'" type="differential" :resource="data" />
				<ResourceTree v-if="currentTab==='2'" type="snapshot" :resource="data" />
				<ResourceTree v-if="currentTab==='3'" type="snapshot" filter="mustSupport" :resource="data" />
			</div>
			<template #footer>

			</template>
		</UCard>
		<div v-else>
			<p>{{ error }}</p>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { ref, useFetch, onMounted } from '#imports';

	const tabs = [
		{ label: 'Sum.', slot: 'summary' },
		{ label: 'Dif.', slot: 'differential-table' },
		{ label: 'Snap.', slot: 'snapshot-table' },
		{ label: 'Snap. (Must)', slot: 'snapshot-table-must' },
	];

	const currentTab = ref('0');

	const props = defineProps<{
		resource: string;
	}>();

	const error = ref(null);

	const { data } = await useFetch(`/_resources/${props.resource}`);

</script>