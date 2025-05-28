<template>
	<div>
		<div class="flex border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex justify-between w-full">
				<div class="flex items-baseline space-x-4">
					<div>
						<div class="text-xs">Type</div>
						<ULink :to="`/resources/${resourceType }`" class="text-sm">{{ resourceType }}</ULink>
					</div>
					<div>
						<div class="text-xs">ID</div>
						<ULink :to="generatedBaseUrl" class="text-sm">{{ resourceId }}</ULink>
					</div>
				</div>
				<div class="flex items-center space-x-4">
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
					<UCheckbox
						v-model="editMode"
						indicator="start"
						variant="card"
						@change="toggleEditMode"
						label="Edit"
						:ui="{
							root: 'p-1.5'
						}"
					/>
					<UDropdownMenu
						:items="items"
						:content="{
							align: 'end',
							side: 'bottom',
							sideOffset: 8
						}">
						<UButton icon="i-lucide:ellipsis-vertical" color="neutral" variant="outline" />
					</UDropdownMenu>
				</div>
			</div>
		</div>
		<div>
			<NuxtPage :resource-type="resourceType" :resource-id="resourceId" :view-type="viewType" :history="history"  />
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useRouter, useRoute, computed, useFhirClient } from '#imports'
	import type { ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceId: string
		resourceType: ResourceType
	}>()

	const { postResource } = useFhirClient()

	const router = useRouter()
	const route = useRoute()

	const editMode = ref(route.fullPath.includes('edit'))

	watch(route, (newRoute) => {
		editMode.value = newRoute.fullPath.includes('edit')
	})

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

	const history = computed(() => {
		return route?.query?.history || null
	})

	const generatedEditUrl = computed(() => {
		return `/resources/${props.resourceType}/${props.resourceId}/edit?${new URLSearchParams(route?.query).toString()}`
	})

	const toggleEditMode = () => {
		if (editMode.value === true) {
			router.push(generatedEditUrl.value)
		} else {
			router.push(generatedBaseUrl.value)
		}
	}

	const generatedBaseUrl = computed(() => {
		return `/resources/${props.resourceType}/${props.resourceId}?${new URLSearchParams(route?.query).toString()}`
	})

	const invalidateExpansion = async () => {
		const { data, error } = await postResource(props.resourceType, props.resourceId, {
			resourceType: props.resourceType
		}, '$invalidate-expansion')
		if (error) {
			console.error('Error invalidating expansion:', error)
			return
		}
	}

	const items = []

	if(props.resourceType === 'ValueSet'){
		items.push({
			label: 'Invalidate Expansion',
			icon: 'i-heroicons-arrow-path',
			onSelect: async () => await invalidateExpansion()
		})
	}

	items.push({
		label: 'Delete',
		icon: 'i-heroicons-trash',
	})

</script>