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
						<ULink :to="`/resources/${resourceType }/${resourceId}`" class="text-sm">{{ resourceId }}</ULink>
					</div>
				</div>
				<div class="flex items-center space-x-4">
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
			<NuxtPage :resource-type="resourceType" :resource-id="resourceId"  />
		</div>
	</div>
</template>
<script setup lang="ts">
	const props = defineProps<{
		resourceId: string
		resourceType: string
	}>()

	const items = [{
		label: 'Edit',
		icon: 'i-heroicons-pencil',
		to: `/resources/${props.resourceType}/${props.resourceId}/edit`,
	}, {
		label: 'Delete',
		icon: 'i-heroicons-trash'
	}]

</script>