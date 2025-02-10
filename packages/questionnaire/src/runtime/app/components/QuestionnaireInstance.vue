<template>
	<section>
		<UCard>
			<template #header>
				<h2 class="">Questionnaire Instance</h2>
			</template>
			<UForm @submit="onSubmit" :schema="schema" :state="state">
				<div class="flex flex-col w-full gap-4">
					<UFormField label="Title" name="title">
						<UInput v-model="state.title" placeholder="Enter a question title" class="w-full" />
					</UFormField>
					<UFormField label="Status" name="status">
						<UTabs v-model="state.status" :content="false" size="xs" defaultValue="draft" :items="[{
							label: 'Draft',
							value: 'draft'
						}, {
							label: 'Active',
							value: 'active'
						},{
							label: 'Retired',
							value: 'retired'
						},{
							label: 'Unknown',
							value: 'unknown'
						}]" class="w-full" />
					</UFormField>
					<UFormField label="Description" name="description">
						<UTextarea v-model="state.description" placeholder="Enter a question description" class="w-full" />
					</UFormField>
					<UFormField label="Purpose" name="purpose">
						<UTextarea v-model="state.purpose" placeholder="Enter a the purpose of the questionaire" class="w-full" />
					</UFormField>
				</div>
				<div class="w-full pt-4">
					<div class="flex justify-end">
						<UButton type="submit">Submit</UButton>
					</div>
				</div>
			</UForm>
		</UCard>
	</section>
</template>
<script lang="ts" setup>
	import z from 'zod'
	import { reactive, useFhir } from '#imports'
	import type { FormSubmitEvent } from '@nuxt/ui'

	const schema = z.object({
		title: z.string(),
		status: z.enum(['draft', 'active', 'retired', 'unknown']),
		description: z.string().optional(),
		purpose: z.string().optional()
	})
	type Schema = z.output<typeof schema>

	const state = reactive<Partial<Schema>>({
		title: undefined,
		status: 'draft',
		description: undefined,
		purpose: undefined
	})

	const { createResource } = useFhir()

	const onSubmit = async (event: FormSubmitEvent<Schema>) => {
		const {  } = await createResource({
			resourceType: 'Questionnaire',
			title: event.data.title,
			status: event.data.status,
			description: event.data.description,
			purpose: event.data.purpose
		})
	}


</script>