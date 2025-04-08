<template>
	<section>
		<!-- Header -->
		<div class="overflow-hidden bg-white shadow-sm sticky top-0 z-10">
			<div class="flex bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4 space-x-4 items-center">
				<ULink to="/resources">
					<UButton icon="heroicons-chevron-left" variant="ghost">Back</UButton>
				</ULink>
				<h1 class="text-xl font-semibold">{{ resourceType }}</h1>
			</div>
			<div class="flex bg-gray-50 gap-4 items-center px-2">
				<UNavigationMenu
					class="w-full"
					highlight-color="primary"
					orientation="horizontal"
					:items="menu"
				/>
			</div>
		</div>
		<NuxtPage :resource-type="resourceType" :profiles="profiles" :resource-id="resourceId" />
	</section>
</template>
<script setup lang="ts">
	import { useFhirCapatibilityStatement } from '#imports'
	import type { FhirResource } from '#fhir/types'

	const router = useRouter()

	const route = useRoute()

	const resourceType = ref<FhirResource | null>(route.params.resource as FhirResource)

	const resourceId = computed(() =>route.params?.id || null)

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

	// read CapabilityStatement and get profiles
	const { loadProfiles } = await useFhirCapatibilityStatement()

	const profiles = await loadProfiles(resourceType.value)
</script>