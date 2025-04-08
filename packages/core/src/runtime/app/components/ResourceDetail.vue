<template>
	<div class="p-4">
		<div class="border border-gray-200 rounded-md">
			<div>
				<FhirDataTypeDisplayBackboneElement
					:resource="resource"
					:nestedElements="resourceDefintion?.element || []" />
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
	import { useFhirCapatibilityStatement, useFhirResource } from '#imports'
	import type { Resource } from '@medplum/fhirtypes'

	const props = defineProps<{
		resource: Resource
	}>()


	const { resolveProfile } = await useFhirCapatibilityStatement()
	const { loadResourceDefinition } = useFhirResource()

	const profileUrl = resolveProfile(props.resource)

	// TODO: remove force reload if implementation is ready
	const resourceDefintion = await loadResourceDefinition(profileUrl, true)
	// END TODO


</script>