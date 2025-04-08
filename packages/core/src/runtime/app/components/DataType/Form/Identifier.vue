<template>
	<div class="flex space-x-2 w-full">
		<UInput v-model="identifier.system" @change="update" placeholder="System" class="w-full" />
		<UInput v-model="identifier.value" @change="update" placeholder="Value" class="w-full" />
	</div>
</template>
<script lang="ts" setup>
	import type { Identifier } from '@medplum/fhirtypes'
	import { ref } from '#imports'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	const props = defineProps<{
		modelValue?: Identifier
		element: InternalSchemaElement
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const identifier = ref(props.modelValue || {
		system: '',
		value: ''
	} as Identifier)

	const update = () => {
		emit('update:modelValue', identifier.value)
		emit('change', identifier.value, props.element)
	}
</script>