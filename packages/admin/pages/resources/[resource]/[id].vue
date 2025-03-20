<template>
	<div>
		<div class="flex justify-between border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex justify-between">
				<div class="flex items-center space-x-4">
					<div>
						<div class="text-xs">Type</div>
						<ULink :to="`/resources/${resourceType }`" class="text-sm">{{ resourceType }}</ULink>
					</div>
					<div>
						<div class="text-xs">ID</div>
						<div class="text-sm">{{ resourceId }}</div>
					</div>
				</div>
				<div>
					<UDropdownMenu />
				</div>
			</div>
		</div>
		<div>
			<NuxtPage :resource-type="resourceType" :resource-id="resourceId"  />
		</div>
	</div>
</template>
<script setup lang="ts">
	defineProps<{
		resourceId: string
		resourceType: string
	}>()
</script>