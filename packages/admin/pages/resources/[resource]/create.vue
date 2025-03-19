<template>
	<div>
		<div class="flex justify-between border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex items-center">
				<h1 class="text-md font-semibold">Create a new {{ resourceType }}</h1>
			</div>
			<div>
				<USelectMenu
					v-model="selectedProfileUrl"
					value-key="url"
					:items="profileItems"
					label="Profile"
					placeholder="Select a profile"
					class="w-[380px]"
					icon="heroicons-clipboard-document-check"
				>
					<template #default="{ modelValue }">
						<div v-if="modelValue" class="flex flex-col items-start  overflow-hidden">
							<div class="">{{ profileItems.find((profile) => profile.url === modelValue)?.label }}</div>
							<div class="text-xs font-thin truncate">{{ modelValue }}</div>
						</div>
						<div v-else class="flex flex-col items-start">
							<div class="text-gray-400">Select a profile</div>
							<div class="text-xs font-thin">{{ resourceType }}</div>
						</div>
					</template>
					<template #item-label="{ item }">
						{{ item.label }}
						<div class="text-xs font-thin">{{ item.url }}</div>
					</template>
				</USelectMenu>
			</div>
		</div>
		<div class="p-8">
			<FhirResourceForm :key="selectedProfileUrl" :resourceUrl="selectedProfileUrl" />
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { StructureDefinition, ResourceType } from '@medplum/fhirtypes'

	type Profile = Pick<StructureDefinition, 'name' | 'description' | 'publisher' | 'status' | 'url'> & { base: boolean }

	const props = defineProps<{
		resourceType: ResourceType,
		profiles: Profile[]
	}>()


	const profileItems = computed(() => {
		return props.profiles.map(profile => {
			return {
				label: profile.name,
				url: profile.url
			}
		})
	})

	const selectedProfileUrl = ref<string>(props?.profiles.find(profile => profile.base)?.url || '')
</script>