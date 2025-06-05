<template>
	<section>
		<FhirResourceTable @select="onSelect" @delete="onDelete" :key="tableKey" :resource-type="resourceType" />
	</section>
</template>
<script setup lang="ts">
	import type { Resource, ResourceType } from '@medplum/fhirtypes'
	import { useFhirClient, operationOutcomeToString, useToast } from '#imports'
	import type { Ref } from '#imports'

	const props = defineProps<{
		resourceType: ResourceType
	}>()

	const { deleteResource } = useFhirClient()
	const toast = useToast()

	const tableKey = ref(props.resourceType || '') as Ref<string>

	const onSelect = (resource: Resource) => {
		navigateTo(`/resources/${props.resourceType}/${resource.id}`)
	}

	const onDelete = async (resource: Resource) => {
		if(!resource.id){
			return
		}
		const data = await deleteResource(props.resourceType, resource.id)
		const issue = operationOutcomeToString(data?.value)
		toast.add({
			title: 'Delete',
			description: issue || 'Resource deleted'
		})
		tableKey.value = `${props.resourceType}-${Date.now()}`
	}
</script>