<template>
	<div class="p-0">
		<div>
			<div v-if="viewType == 'data'" class="border border-gray-200">
				<FhirDataTypeDisplayBackboneElement
					:resource="resource"
					:nestedElements="resourceDefintion?.element || []" />
			</div>
			<div v-else-if="viewType == 'json'">
              <JsonEditorVue
				v-model="resourceRef"
                :main-menu-bar="false"
				:read-only="true"
                mode="tree"
              />
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
	import { useFhirCapatibilityStatement, useFhirResource, computed, ref } from '#imports'
	import type { Resource } from '@medplum/fhirtypes'

	const props = defineProps<{
		resource: Resource | null
		viewType?: 'data' | 'json'
	}>()

	const resourceRef = ref(props.resource)

	const viewType = computed(() => props.viewType || 'data')

	const { resolveProfile } = await useFhirCapatibilityStatement()
	const { loadResourceDefinition } = useFhirResource()

	const profileUrl = props?.resource ? resolveProfile(props.resource) : null

	// TODO: remove force reload if implementation is ready
	const resourceDefintion = await loadResourceDefinition(profileUrl, true)
	// END TODO

</script>