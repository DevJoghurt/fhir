<template>
	<div>
		<div class="flex justify-between border-b border-gray-200 mx-auto px-8 py-2">
			<div class="flex items-center">
				<h1 class="text-md font-semibold">Edit {{ resourceType }}</h1>
			</div>
		</div>
		<div class="p-8">
			<UCard>
				<FhirResourceForm v-model="resource" :resourceUrl="resourceUrl" :viewType="viewType" />
				<template #footer>
					<div class="flex justify-end">
						<UButton :loading="loading" @click.prevent="onSubmit">Update</UButton>
					</div>
				</template>
			</UCard>
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
			navigateTo(`/resources/${props.resourceType}/${data.value.id}`)
		}
	}
</script>