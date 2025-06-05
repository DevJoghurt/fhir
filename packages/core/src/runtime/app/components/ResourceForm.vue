<template>
	<UCard>
		<UForm
			v-if="viewType == 'data'"
			:state="resourceState"
			class="space-y-2">
			<UFormField
				label="Resource Type"
				name="resourceType"
				size="sm"
				>
				<UInput class="w-full" disabled v-model="resourceState.resourceType" />
			</UFormField>
			<UFormField
				label="Id"
				name="id"
				size="sm"
				>
				<UInput class="w-full" disabled v-model="resourceState.id" />
			</UFormField>
			<div v-if="resourceDefintion" class="py-4 space-y-4">
				<FhirDataTypeFormBackboneElement v-model="resourceState" @change="update" :nestedElements="resourceDefintion.element" />
			</div>
		</UForm>
		<JsonEditorVue
			v-else-if="viewType == 'json'"
			v-model="dataRef"
			:onChange="updateJsonEditor"
			:main-menu-bar="false"
			mode="tree"
		/>
	</UCard>
</template>
<script lang="ts" setup>
	import { ref, useFhirResource, computed, watch, toRef } from '#imports'

	/**
	 * TODO: Refactor this component to use a class representation of the resource and provide and inject the class to the form items.
	 * For this we need to write own form and field components that can handle the class representation of the resource.
	 * This can also allow us to implement validation and other features in a more elegant way.
	 * For now we are using the existing form and field components and passing the resource state as a prop to the form items.
	 * This approach is working but is not ideal and can lead to issues with reactivity and performance.
	 * Furthermore the logic is spread across multiple components and is not easy to follow.
	 */

	const props = defineProps<{
		modelValue?: any
		resourceUrl: string
		viewType?: 'data' | 'json'
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const resourceUrl = ref(props?.resourceUrl || '')
	const viewType = computed(() => props.viewType || 'data')

	const { loadResourceDefinition, createResourceState, generateResource } = useFhirResource()

	// TODO: remove force reload if implementation is ready
	const resourceDefintion = await loadResourceDefinition(resourceUrl.value, true)

	// END TODO
	let resourceState = createResourceState(resourceDefintion?.element || [], props.modelValue || {})

	const dataRef = toRef(resourceState)

	watch(viewType, (type) => {
		if (type === 'data') {
			resourceState = createResourceState(resourceDefintion?.element || [], dataRef.value || {})
		}
		if (type === 'json') {
			dataRef.value = createResourceState(resourceDefintion?.element || [], resourceState || {})
		}
	})

	const updateJsonEditor = (value: any) => {
		const resource = generateResource(resourceDefintion, value.json)
		emit('update:modelValue', resource)
	}

	const update = () => {
		const resource = generateResource(resourceDefintion, resourceState, props.modelValue)
		emit('update:modelValue', resource)
	}
</script>