<template>
	<div class="px-2 py-4">
		<h2 class="font-normal !text-base text-blackA11 pt-1">
			Summary
		</h2>
		<div class="mt-4">
			<ul class="space-y-1">
				<li class="flex items-baseline">
					<div class="w-28 text-sm">Name</div>
					<div class="flex-1 text-xs">{{ resource?.id || '' }}</div>
				</li>
				<li class="flex items-baseline">
					<div class="w-28 text-sm">Fhir Version</div>
					<div class="flex-1 text-xs">{{ resource?.fhirVersion || '' }}</div>
				</li>
				<li class="flex items-baseline">
					<div class="w-28 text-sm">Url</div>
					<NuxtLink class="flex-1 text-xs" :to="resource?.url" target="_blank">{{ resource?.url || '' }}</NuxtLink>
				</li>
				<li class="flex items-baseline">
					<div class="w-28 text-sm">Description</div>
					<div class="flex-1 text-xs">{{ resource?.description || '' }}</div>
				</li>
				<li class="flex items-baseline">
					<div class="w-28 text-sm">Base Definition</div>
					<div class="flex-1 text-xs">{{ resource?.baseDefinition || '' }}</div>
				</li>
			</ul>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { StructureDefinition } from '@medplum/fhirtypes'

	const { resource } = defineProps<{
		resource: StructureDefinition
	}>()

</script>