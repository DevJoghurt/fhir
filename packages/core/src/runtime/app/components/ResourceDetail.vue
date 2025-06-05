<template>
	<div class="p-0">
		<div>
			<div v-if="viewType == 'data' && resourceRef" class="border border-gray-200">
				<FhirDataTypeDisplayBackboneElement
					:resource="resourceRef"
					:nestedElements="resourceDefintion?.element || []" />
			</div>
			<div v-else-if="viewType == 'json' && resourceRef">
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
	import { useFhirCapatibilityStatement, useFhirResource, computed, ref, toRef } from '#imports'
	import type { Resource } from '@medplum/fhirtypes'
	import type { Ref } from '#imports'

	const props = defineProps<{
		resource?: Resource | null
		viewType?: 'data' | 'json'
	}>()

	const resourceRef = toRef(() => props?.resource || null) as Ref<Resource | null>

	const viewType = computed(() => props.viewType || 'data')

	const { resolveProfile } = await useFhirCapatibilityStatement()
	const { loadResourceDefinition } = useFhirResource()

	const profileUrl = props?.resource ? resolveProfile(props.resource) : null

	// TODO: remove force reload if implementation is ready
	const resourceDefintion = await loadResourceDefinition(profileUrl, true)
	// END TODO
</script>