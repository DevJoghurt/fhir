<template>
	<section>
		<div class="flex h-16 justify-between w-full bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4 space-x-4 items-center">
			<div></div>
			<div class="flex items-center">
				<UModal>
					<UButton
						label="Search Package"
						color="neutral"
						variant="subtle"
						icon="i-lucide-search"
					/>

					<template #content>
						<UCommandPalette
							v-model:search-term="searchTerm"
							:loading="status === 'pending'"
							:groups="groups"
							placeholder="Search Package"
							class="h-80"
						>
							<template #item="{ item }">
								<div class="flex justify-between space-x-2 w-full">
									<div class="flex flex-col items-start">
										<div class="text-sm font-medium text-gray-900">{{ item.label }}</div>
										<div class="line-clamp-2 text-xs text-left text-gray-500">{{ item.suffix }}</div>
									</div>
									<div class="flex items-center">
										<UButton
											label="Install"
											size="sm"
											color="neutral"
											variant="subtle"
											icon="i-lucide-plus"
											@click=""
											>
										</UButton>
									</div>
								</div>
							</template>
						</UCommandPalette>
					</template>
				</UModal>
			</div>
		</div>
		<div>
			<NuxtLink v-for="(pkg, index) in packages" :key="index" :to="`/system/packages/${encodeURIComponent(pkg.identifier)}`" class="p-4 border-b border-gray-200 flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<UChip
						inset
						:color="resolveStatusColor(pkg.status)">
						<UAvatar v-if="pkg.status?.process === 'idle'" :src="pkg.meta?.source" icon="heroicons-squares-2x2" size="sm" />
						<UButton v-else-if="pkg.status?.process === 'waiting'" size="sm" color="neutral" variant="outline" icon="heroicons-question-mark-circle" class="rounded-full" />
						<UButton v-else-if="pkg.status?.process === 'running'" size="sm" color="neutral" variant="outline" loading class="rounded-full" />
					</UChip>
					<div class="flex flex-col">
						<div class="text-sm font-medium text-gray-900">{{ pkg?.meta?.name || pkg.identifier }}</div>
						<div class="text-sm text-gray-500">{{ pkg?.meta?.description }}</div>
					</div>
				</div>
				<div class="text-sm text-gray-500">{{ pkg.meta?.version }}</div>
			</NuxtLink>
		</div>
	</section>
</template>
<script lang="ts" setup>
	import { reactive, ref } from '#imports'
	import type { FormSubmitEvent } from '@nuxt/ui'
	import type { PackageStatus } from '#fhirtypes/profiling'
	import z from 'zod'

	const { data: packages } = await useFetch('/api/fhir/packages', {
		query: {
			columns: ['identifier', 'status', 'meta'],
		}
	})

	const packageSchema = z.object({
		package: z.string(),
		version: z.string()
	})

	type PackageSchema = z.output<typeof packageSchema>

	const packageState = reactive<Partial<PackageSchema>>({
		package: undefined,
		version: undefined
	})

	const searchTerm = ref('')

	type PackageSearchResponse = {
		status: string;
		message: string;
		packages: Array<{
			Name: string;
			Value: string;
			Description: string;
		}>;
	}

	const { data: packageSearch, status } = await useFetch('/api/fhir/packages/search', {
		key: 'fhir-packages-search',
		method: 'POST',
		body: { 
			search: searchTerm 
		},
		transform: (data: PackageSearchResponse) => {
			return data?.packages?.map(pkg => ({ 
				id: pkg.Name, 
				label: pkg.Value, 
				suffix: pkg.Description
			})) || []
		},
		lazy: true
	})

	const groups = computed(() => [{
		id: 'packages',
		label: searchTerm.value ? `Packages matching “${searchTerm.value}”...` : 'Packages...',
		items: packageSearch.value || [],
		ignoreFilter: true
	}])

	function resolveStatusColor(status: PackageStatus) {
		if(status?.installed) {
			return 'success'
		}
		if(status?.loaded) {
			return 'primary'
		}
		return 'error'
	}

	const onPackageSubmit = async (event: FormSubmitEvent<PackageSchema>) => {
		/*
		TODO: Add package logic here
		const resp = await $fetch('/api/fhir/package-loader', {
			method: 'POST',
			body: event.data
		})
		console.log(resp)
		*/
	}
</script>