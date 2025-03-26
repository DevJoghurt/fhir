<template>
	<UCard>
		<UForm
			ref="ResourceForm"
			:state="resourceState"
			@submit="handleSubmit"
			class="space-y-2">
			<UFormField
				label="Resource Type"
				name="resourceType"
				size="sm"
				>
				<UInput name="resourceType" class="w-full" disabled v-model="resourceState.resourceType" />
			</UFormField>
			<UFormField
				label="Id"
				name="id"
				size="sm"
				>
				<UInput name="id" class="w-full" disabled v-model="resourceState.id" />
			</UFormField>
			<div v-if="resourceDefintion" class="py-4 space-y-4">
				<template v-for="element in resourceDefintion.element" :key="element.path">
					<UFormField
						:label="element.name"
						:name="element.path"
						:required="element.isRequired"
						:description="element.description"
						size="sm"
						>
						<component
							:is="`FhirDataTypeForm-${element.type}`"
							v-model="resourceState[element.path]"
							:isArray="element.isArray"
							:binding="element.binding"
						/>
					</UFormField>
				</template>
			</div>
		</UForm>
		<template #footer>
			<div class="flex justify-end">
				<UButton @click="form?.submit()" :loading="loading">Create</UButton>
			</div>
		</template>
	</UCard>
</template>
<script lang="ts" setup>
	import type { FormSubmitEvent } from '@nuxt/ui'
	import { useFhir, ref, useStructureDefinition, useTemplateRef } from '#imports'
	import type { Resource } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceUrl: string
	}>()

	const emit = defineEmits<{
		(e: 'submit', resource: Resource): void
	}>()

	const form = useTemplateRef('ResourceForm')

	const { createResource } = useFhir()

	let loading = ref(false)

	const resourceUrl = ref(props?.resourceUrl || '')

	const structureDefintion = useStructureDefinition()

	// TODO: remove force reload if implementation is ready
	const resourceDefintion = await structureDefintion.loadResourceDefinition(resourceUrl.value, true)
	// END TODO

	console.log(resourceDefintion)

	const resourceState = await structureDefintion.getResourceState(resourceUrl.value)
	console.log(resourceState)

	const handleSubmit = async (event: FormSubmitEvent<any>) => {
		event.preventDefault()

		const resource = await structureDefintion.createResource(resourceUrl.value, resourceState)
		if(!resource){
			return
		}
		loading.value = true
		const { data } = await createResource<any>(resource)
		loading.value = false
		form.value?.clear()
		emit('submit', data.value)
	}
</script>