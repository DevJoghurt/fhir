<template>
	<div>
		<div class="flex justify-between border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex items-center">
			</div>
			<UTabs
				v-model="viewType"
				:ui="{
					root: 'gap-0'
				}"
				:items="[{
					label: 'Data',
					value: 'data',
					icon: 'i-lucide:book-open',
				}, {
					label: 'JSON',
					value: 'json',
					icon: 'i-lucide:code',
				}]"
				size="xs" />
		</div>
		<div class="p-8">
			<FhirOperationOutcomeAlert v-if="error" :issues="error?.data?.issue" />
			<FhirResourceDetail :view-type="viewType" :resource="resource"  />
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useRouter, useRoute } from '#imports'
	import type { ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceId: string
		resourceType: ResourceType
	}>()
	const router = useRouter()
	const route = useRoute()

	const viewType = computed({
		get() {
			return (route?.query?.viewType as 'data' | 'json') || 'data'
		},
		set(tab) {
			router.replace({
				query: {
					...route.query,
					viewType: tab,
				},
			})
		}
	})

	const { readResource } = useFhirClient()

	const { data: resource, error} = await readResource(props.resourceType || 'Basic', props?.resourceId || '')
</script>