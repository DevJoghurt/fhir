<template>
	<div class="p-4">
		<ContentQuery path="/docs/resources/structuredefinition-researchstudy">
			<template #default="{ data }">
				<UCard>
					<template #header>
						<h1 class="text-lg font-thin">Resource Profile: {{ data[0].id }}</h1>
					</template>
					<UTabs :items="tabs" class="w-full">
						<template #snapshot-table="{ label }">
							<div>
								<ResourceTree :items="data[0].snapshot.element" />
							</div>
						</template>
						<template #differential-table="{ label }">
							<div>
								<ResourceTree :items="data[0].differential.element" />
							</div>
						</template>
					</UTabs>
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
	const tabs = [
		{ label: 'Summary', slot: 'summary' },
		{ label: 'Differential Table', slot: 'differential-table' },
		{ label: 'Snapshot Table', slot: 'snapshot-table' },
		{ label: 'Snapshot Table (Must)', slot: 'snapshot-table-must' },
	];
</script>