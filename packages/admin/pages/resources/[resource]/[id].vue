<template>
	<div>
		<div class="flex border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex justify-between w-full">
				<div class="flex items-center space-x-4">
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
			<NuxtPage :resource-type="resourceType" :resource-id="resourceId" :view-type="viewType"  />
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useRouter, useRoute, computed } from '#imports'

	const props = defineProps<{
		resourceId: string
		resourceType: string
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

	const generatedEditUrl = computed(() => {
		return `/resources/${props.resourceType}/${props.resourceId}/edit?${new URLSearchParams(route?.query).toString()}`
	})

	const generatedBaseUrl = computed(() => {
		return `/resources/${props.resourceType}/${props.resourceId}?${new URLSearchParams(route?.query).toString()}`
	})

	const items = [{
		label: 'Edit',
		icon: 'i-heroicons-pencil',
		to: generatedEditUrl,
	}, {
		label: 'Delete',
		icon: 'i-heroicons-trash'
	}]

</script>