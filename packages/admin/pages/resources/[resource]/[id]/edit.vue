<template>
	<div>
		<div class="p-8">
			<FhirResourceForm v-model="resource" :resourceUrl="resourceUrl" :viewType="viewType" />
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
	import type { Resource } from '@medplum/fhirtypes'

	const props = defineProps<{
		resourceType: string
		resourceId: string
		viewType: 'data' | 'json'
	}>()

	const { readResource, updateResource } = useFhirClient()
	const { resolveProfile } = await useFhirCapatibilityStatement()

	const  { data: resource } = await readResource<Resource>(props.resourceType, props.resourceId)

	const resourceUrl = resolveProfile(resource.value)

	const loading = ref(false)

	const onSubmit = async () => {
		const { data, status } = await updateResource<any>(resource.value)
		if(status.value === 'success'){
			navigateTo(`/resources/${props.resourceType}/${data.value.id}`, {
				external: true,
			})
		}
	}
</script>