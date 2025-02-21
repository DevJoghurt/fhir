<template>
	<div>
		<div>
			<div class="bg-gray-50 border-b border-gray-200 flex justify-between container mx-auto px-4 py-4">
				<h1 class="text-xl font-semibold">Resources</h1>
				<div class="flex items-center space-x-4">
					<UInput v-model="searchString" placeholder="Search resources" />
				</div>
			</div>
			<!-- List all resources -->
			<div class="flex">
				<div class="container mx-auto px-4 py-6">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
						<NuxtLink v-for="item in filteredResources" :key="item.profile"  :to="`/resources/${item.type}`" class="shadow cursor-pointer hover:shadow-lg rounded-lg p-4">
								<h2 class="text-md font-semibold break-words">{{ item.type }}</h2>
								<div class="min-h-18 py-4">
									<p class="text-xs text-gray-500 line-clamp-4 break-words">{{ item.profile }}</p>
								</div>
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { ref, useFhir, computed } from '#imports'

	const searchString = ref<string>('')

	const { readCapabilityStatement} = useFhir()

	const { data: capabilityStatement } = await readCapabilityStatement()

	const filteredResources = computed(() =>{
		const rest = capabilityStatement.value?.rest || []
		if (typeof rest[0] === 'undefined') {
			return []
		}
		const resources = rest[0].resource || []
		if (!searchString.value) {
			return resources
		}
		return resources.filter((item: any) => {
			return item.type.toLowerCase().includes(searchString.value.toLowerCase())
		})
	})
</script>