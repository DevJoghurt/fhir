<template>
	<div>
		<div class="bg-gray-50 border-b border-gray-200 flex justify-between px-6 py-4">
			<h1 class="text-xl font-semibold">Resources</h1>
			<div class="flex items-center space-x-4">
				<UInput v-model="searchString" placeholder="Search resources" />
			</div>
		</div>
		<!-- List all resources -->
		<div class="flex">
			<div class="container mx-auto px-4 py-6">
				<div v-if="filteredResources.length > 0" class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					<NuxtLink v-for="item in filteredResources" :key="item.name"  :to="`/resources/${item.name}`" class="shadow-xs border-1 border-gray-100 cursor-pointer hover:border-gray-200 hover:shadow-sm rounded-lg p-4">
							<h2 class="text-md font-semibold break-words">{{ item.name }}</h2>
							<div class="min-h-18 py-4">
								<p class="text-xs text-gray-500 line-clamp-4 break-words">{{ item.type }}</p>
							</div>
							<UBadge variant="soft" color="neutral">Profiles {{ item.profile.supported?.length || 0 }}</UBadge>
					</NuxtLink>
				</div>
				<div v-else class="p-4">
					<p class="text-gray-500">No resources found</p>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { ref, useFhirCapatibilityStatement, computed } from '#imports'

	const searchString = ref<string>('')

	const { getResources } = await useFhirCapatibilityStatement()

	const loadedResources = getResources()

	const filteredResources = computed(() =>{
		if (!searchString.value) {
			return loadedResources
		}
		return loadedResources.filter((item: any) => {
			return item.name.toLowerCase().includes(searchString.value.toLowerCase())
		})
	})
</script>