<template>
	<div>
		<div class="p-8">
			<FhirResourceForm  v-model="resourceRef" :resourceUrl="resourceUrl" :viewType="viewType" />
			<div class="h-18"></div>
		</div>
		<div class="fixed bottom-0 left-0 right-0 bg-neutral-50 border-t border-gray-200 py-2 px-12">
			<div class="flex justify-end">
				<UButton :loading="loading" @click.prevent="onSubmit">Update</UButton>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { Resource, ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceType: ResourceType
		resourceId: string
		viewType: 'data' | 'json'
	}>()

	const { readResource, updateResource } = useFhirClient()
	const { resolveProfile } = await useFhirCapatibilityStatement()

	const resource = await readResource(props.resourceType, props.resourceId)

	// create reactive state for the resource
	const resourceRef = ref<Resource | null>(resource)

	const resourceUrl = resolveProfile(resource)

	const loading = ref(false)

	const onSubmit = async () => {
		const data = await updateResource(resourceRef.value as Resource)
		if(data?.id){
			navigateTo(`/resources/${props.resourceType}/${data.id}`, {
				external: true,
			})
		}
	}
</script>