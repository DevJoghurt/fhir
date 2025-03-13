<template>
	<section>
		<div class="h-12 border-b border-gray-200 px-6 flex items-center justify-between">
			<div></div>
			<div class="flex items-center">
				<UModal title="Add Profile" size="lg">
					<UButton color="primary" size="sm" icon="heroicons-plus">Add Profile</UButton>

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
	</section>
</template>
<script lang="ts" setup>
	import { reactive, useTemplateRef } from '#imports'
	import type { FormSubmitEvent } from '@nuxt/ui'
	import z from 'zod'

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

	const onPackageSubmit = async (event: FormSubmitEvent<PackageSchema>) => {
		const resp = await $fetch('/api/fhir/package-loader', {
			method: 'POST',
			body: event.data
		})
		console.log(resp)
	}
</script>