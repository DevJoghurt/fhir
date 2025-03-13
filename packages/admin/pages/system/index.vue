<template>
	<section>
		<div v-if="error" class="p-4">
			<div class="rounded border border-red-500 bg-red-100 text-red-900 px-4 py-3 mb-4" role="alert">
				<p class="font-bold">Error</p>
				<p>{{ error.message }}</p>
				<p class="text-md mt-2">Unable to connect to the server. Please try again later.</p>
			</div>
		</div>
		<div v-if="!error" class="flex flex-row gap-4 px-4 py-6">
			<UCard
				class="w-full lg:w-1/2">
				<template #header>
					<div class="flex justify-between">
						<div class="flex items-center gap-4">
							<UIcon name="heroicons-server" class="text-xl" />
							<h3 class="text-md font-normal">Server Information</h3>
						</div>
						<UBadge :color="statusColorMapping[capabilityStatement.status]">{{ capabilityStatement.status }}</UBadge>
					</div>
				</template>
				<div>
					<div class="">
						<h1 class="text-md font-bold">Software</h1>
						<p class="text-sm">{{ capabilityStatement?.software?.name }} {{ capabilityStatement?.software?.version }}</p>
						<p class="text-sm">Fhir Version: {{ capabilityStatement?.fhirVersion }}</p>
						<p class="text-sm">URL: {{ capabilityStatement?.implementation?.url }}</p>
					</div>
				</div>
			</UCard>
			<UCard
				class="w-full lg:w-1/2">
				<template #header>
					<div class="flex">
						<div class="flex items-center gap-4">
							<UIcon name="heroicons-clock" class="text-xl" />
							<h3 class="text-md font-normal">History</h3>
						</div>
					</div>
				</template>
				<ul>
					<li v-for="item in history.entry" :key="item.id" class="border-b border-gray-200 flex justify-between gap-2 py-2">
						<div class="flex gap-2">
							<UBadge>{{ item.request?.method }}</UBadge>
							<span>{{ item.request?.url }}</span>
						</div>
						<UBadge color="neutral">{{ item.response?.status }}</UBadge>
					</li>
				</ul>
			</UCard>
		</div>
	</section>
</template>
<script setup lang="ts">
	const { readCapabilityStatement, readHistory } = useFhir()

	const statusColorMapping = {
		draft: 'neutral',
		active: 'success',
		retired: 'error',
		unknown: 'info'
	} as const

	const { data: capabilityStatement, error } = await readCapabilityStatement()

	const { data: history } = await readHistory(null, null, {
		query: {
			_limit: 10
		}
	})
</script>