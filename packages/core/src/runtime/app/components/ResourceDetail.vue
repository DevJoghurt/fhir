<template>
	<div class="p-4">
		<FhirOperationOutcomeAlert v-if="error" :issues="error?.data?.issue" />
		<div v-else class="border border-gray-200 rounded-md">
			<div>
				<template v-for="element in resourceDefintion?.element" :key="element.path">
					<div v-if="element" class="border-b border-gray-200 p-4">
						<label class="text-sm font-medium">{{ element.name }}</label>
						<div class="text-xs">
							<component
								:is="`FhirDataTypeDisplay-${element.type}`"
								:value="resourceState[element.path]"
								:isArray="element.isArray"
							/>
						</div>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
	import { useFhir, useResource, useStructureDefinition, ref, reactive } from '#imports'
	import { FhirOperationOutcomeAlert } from '#components'
	import type { ResourceType } from '@medplum/fhirtypes'

	const props = defineProps<{
		type: ResourceType
		id: string
	}>()

	const { readResource } = useFhir()

	const { data: resource, error} = await readResource(props.type || 'Basic', props?.id || '')


	const resourceHandler = await useResource()
	const profileUrl = resourceHandler.resolveProfile(resource.value)

	const structureDefintion = useStructureDefinition()
	const resourceDefintion = await structureDefintion.loadResourceDefinition(profileUrl, true)
	const resourceState = await structureDefintion.getResourceState(profileUrl, resource.value)
</script>