<template>
	<div>
		<ul v-if="profiles && profiles.length > 0" class="border border-gray-200 divide-y divide-gray-200">
			<li v-for="profile in profiles" :key="profile?.url" class="flex justify-between items-center p-4">
				<div>
					<h2 class="text-lg font-semibold">{{ profile?.name }}</h2>
					<div class="text-sm text-gray-500">{{ profile?.description }}</div>
					<p class="text-sm text-gray-500">{{ profile?.publisher }}</p>
					<p class="mt-2 text-xs text-gray-500">{{ profile?.url }}</p>
				</div>
				<div>
					<UBadge color="primary">{{ profile?.status }}</UBadge>
				</div>
			</li>
		</ul>
		<div v-else class="p-4 text-gray-500">
			<UAlert
				color="error"
				variant="subtle"
				title="No profiles found"
				description="No profiles found for this resource type."
				icon="i-lucide-terminal"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { FhirResource } from '#fhir/types'
	import type { StructureDefinition } from '@medplum/fhirtypes'

	defineProps<{
		resourceType: FhirResource,
		profiles: Pick<StructureDefinition, 'name' | 'description' | 'publisher' | 'status' | 'url'>[]
	}>()
</script>