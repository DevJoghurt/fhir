<template>
	<section>
		<div class="flex bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4">
			<h1 class="text-xl font-semibold">{{ resourceType }}</h1>
		</div>
		<div class="flex bg-gray-50 gap-4 items-center">
			<ULink to="/resources">
				<UButton icon="heroicons-chevron-left" variant="ghost">Back</UButton>
			</ULink>
			<UNavigationMenu
				class="w-full"
				highlight-color="primary"
				orientation="horizontal"
				:items="menu"
			/>
		</div>
		<NuxtPage :resource-type="resourceType" />
	</section>
</template>
<script setup lang="ts">
	import type { FhirResource } from '#fhir/types'

	const route = useRoute()

	const resourceType = ref<FhirResource | null>(route.params.id as FhirResource)

	const isBasePath = computed(() => !['profile', 'create', 'upload'].some(el => route.path.includes(el)))

	const menu = computed(() => [[
		{
			label: 'Entries',
			to: `/resources/${resourceType.value}`,
			icon: 'heroicons-document-text',
			active: isBasePath.value ? true : false
		},
		{
			label: 'Profiles',
			to: `/resources/${resourceType.value}/profiles`,
			icon: 'heroicons-clipboard-document-check',
		}
	],[
		{
			label: 'Create',
			to: `/resources/${resourceType.value}/create`,
			icon: 'heroicons-plus',
		},
		{
			label: 'Upload',
			to: `/resources/${resourceType.value}/upload`,
			icon: 'heroicons-arrow-up-on-square-stack',
		}
	]])
</script>