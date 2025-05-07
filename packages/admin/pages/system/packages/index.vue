<template>
	<section>
		<div class="flex h-16 justify-between w-full bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4 space-x-4 items-center">
			<div></div>
			<div class="flex items-center">
				<UModal
					v-model:open="packageSearchOpen"
				>
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
								<a @click="select(item)" class="flex justify-between space-x-2 w-full cursor-pointer hover:bg-gray-100 p-2 rounded-md">
									<div  class="flex flex-col items-start">
										<div class="text-sm font-medium text-gray-900">{{ item.label }}</div>
										<div class="line-clamp-2 text-xs text-left text-gray-500">{{ item.suffix }}</div>
									</div>
								</a>
							</template>
						</UCommandPalette>
					</template>
				</UModal>
				<USlideover
					v-model:open="slideoverOpen"
					title="Install Package">
					<template #body>
						<div>
							<div class="flex items-center space-x-2 mb-4">
								<UIcon
									name="i-heroicons-squares-2x2"
									size="xl" />
								<div>
									<div class="text-sm font-medium text-gray-900">{{ packageFind?.name || packageName }}</div>
									<div class="line-clamp-2 text-xs text-left text-gray-500">
										{{ packageFind?.description }}
									</div>
								</div>
							</div>
							<div class="py-4">
								<p class="text-sm text-gray-500">Select a package version to install</p>
							</div>

							<URadioGroup
								color="primary"
								variant="card"
								v-model="selectedPackageVersion"
								:items="packageFind?.versions || []">
								<template #description="{ item }">
									<div class="text-wrap break-all line-clamp-2 text-sm text-gray-500">
										{{ item?.description || item.label }}
									</div>
								</template>
							</URadioGroup>
						</div>
					</template>
					<template #footer>
						<div class="flex justify-between mb-4 w-full">
							<UButton
								label="Close"
								color="neutral"
								variant="subtle"
								@click="slideoverOpen = false"
							/>
							<UButton
								label="Install Package"
								color="primary"
								@click="onPackageSubmit"
							/>
						</div>
					</template>
				</USlideover>
			</div>
		</div>
		<div>
			<NuxtLink v-for="(pkg, index) in packages" :key="index" :to="`/system/packages/${encodeURIComponent(pkg.identifier)}`" class="p-4 border-b border-gray-200 flex items-center justify-between">
				<div class="flex items-center space-x-4">
					<UChip
						inset
						:color="resolveStatusColor(pkg.status)">
						<UAvatar v-if="pkg?.process === 'idle'" :src="pkg.meta?.source" icon="heroicons-squares-2x2" size="sm" />
						<UButton v-else-if="pkg?.process === 'waiting'" size="sm" color="neutral" variant="outline" icon="heroicons-question-mark-circle" class="rounded-full" />
						<UButton v-else-if="pkg?.process === 'running'" size="sm" color="neutral" variant="outline" loading class="rounded-full" />
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
	import { ref } from '#imports'
	import type { FormSubmitEvent } from '@nuxt/ui'
	import type { PackageStatus, PackageLoaderResponse, PackageSearchResponse } from '#fhirtypes/profiling'
	import z from 'zod'

	const { data: packages, refresh } = await useFetch('/api/fhir/packages', {
		query: {
			columns: ['identifier', 'process', 'status', 'meta'],
		}
	})

	const packageSchema = z.object({
		package: z.string(),
		version: z.string()
	})

	type PackageSchema = z.output<typeof packageSchema>

	const packageName = ref('')
	const searchTerm = ref('')
	const slideoverOpen = ref(false)
	const packageSearchOpen = ref(false)
	const selectedPackageVersion = ref('')

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

	const { data: packageFind } = await useFetch('/api/fhir/packages', {
		key: 'fhir-packages-find',
		method: 'POST',
		body: {
			name: packageName
		},
		transform: (data: PackageLoaderResponse) => {
			return {
				_id: data?._id || '',
				name: data?.name || '',
				description: data?.description || '',
				// tranform versions and sort descending by version
				versions: Object.entries(data?.versions || {}).map(([key, pkgV]) => ({
					label: key,
					description: pkgV.description,
					value: key,
					url: pkgV.url,
					dist: pkgV.dist
				})).sort((a, b) => {
					const aVersion = a.label.split('.').map(Number)
					const bVersion = b.label.split('.').map(Number)
					for(let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
						if(aVersion[i] !== bVersion[i]) {
							return (bVersion[i] || 0) - (aVersion[i] || 0)
						}
					}
					return 0
				}),
			}
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

	const select = (item: { id: string; label: string; suffix: string }) => {
		packageName.value = item.label
		slideoverOpen.value = true
	}

	const onPackageSubmit = async (event: FormSubmitEvent<PackageSchema>) => {
		if(!selectedPackageVersion.value || selectedPackageVersion.value === '') {
			return
		}
		const res = await $fetch('/api/fhir/packages/install', {
			method: 'POST',
			body: {
				package: packageName.value,
				version: selectedPackageVersion.value
			},
		})
		if(res?.status !== 200) {
			console.error('Error installing package', res?.message)
			return
		}
		packages.value.unshift(res?.data)
		// reset ui state
		selectedPackageVersion.value = ''
		slideoverOpen.value = false
		packageSearchOpen.value = false
		packageName.value = ''
	}

	let interval = null as null | ReturnType<typeof setInterval>

	onMounted(() => {
		interval = setInterval(() => {
			refresh()
		}, 10000)
	})

	onBeforeUnmount(() => {
		if(interval) clearInterval(interval)
	})
</script>