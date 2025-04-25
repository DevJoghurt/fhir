<template>
	<section>
		<div class="flex h-16 justify-between w-full bg-gray-100 border-b border-gray-200 mx-auto px-4 py-4 space-x-4 items-center">
			<div></div>
			<div class="flex items-center">
				<UModal title="Add Package" size="lg">
					<UButton color="primary" size="sm" icon="heroicons-plus">Add Package</UButton>

					<template #body>
						<div class="p-4">
							<UForm
								ref="packageForm"
								class="space-y-4"
								:schema="packageSchema"
								:state="packageState"
								@submit="onPackageSubmit">
								<UFormField label="Package Name" name="package" required>
									<UInput v-model="packageState.package" class="w-full" />
								</UFormField>
								<UFormField label="Package Version" name="version" required>
									<UInput v-model="packageState.version" class="w-full" />
								</UFormField>
							</UForm>
						</div>
					</template>
					<template #footer>
						<div class="flex justify-end w-full">
							<UButton color="primary" icon="heroicons:arrow-down-on-square" class="cursor-pointer" @click="form?.submit()">Add Profile</UButton>
						</div>
					</template>
				</UModal>
			</div>
		</div>
		<div>
			<NuxtLink v-for="(pkg, index) in packages" :key="index" :to="`/system/packages/${pkg.identifier}`" class="p-4 border-b border-gray-200 flex items-center justify-between">
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
	import { reactive, useTemplateRef } from '#imports'
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

	const form = useTemplateRef('packageForm')

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