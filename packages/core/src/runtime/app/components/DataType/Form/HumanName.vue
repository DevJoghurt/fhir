<template>
	<div class="flex flex-row space-x-2">
		<USelect v-model="flattenedValue.use" @change="update" :items="useItems" class="w-72" />
		<UInput v-model="flattenedValue.family" @change="update" placeholder="Family" class="w-full" />
		<UInput v-model="flattenedValue.given" @change="update" placeholder="Given" class="w-full" />
		<UInput v-model="flattenedValue.prefix" @change="update" placeholder="Prefix" class="w-full" />
		<UInput v-model="flattenedValue.suffix" @change="update" placeholder="Suffix" class="w-full" />
	</div>
</template>
<script lang="ts" setup>
	import type { HumanName } from '@medplum/fhirtypes'
	import { ref } from '#imports'
	import type { Ref } from 'vue'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type FlattenedHumanName = {
		use: 'official' | 'usual' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden'
		family: string
		given: string
		prefix: string
		suffix: string
	}

	const props = defineProps<{
		modelValue?: HumanName
		element: InternalSchemaElement
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const getFlattenedValue = (name: HumanName) : Ref<FlattenedHumanName> => {
		return ref({
			use: name?.use || 'official',
			family: name?.family || '',
			given: name?.given?.length && name?.given?.length > 0 ? name.given[0] : '',
			prefix: name?.prefix?.length && name?.prefix?.length > 0 ? name.prefix[0] : '',
			suffix: name?.suffix?.length && name?.suffix?.length > 0 ? name.suffix[0] : ''
		})
	}

	const getHumanName = (name: FlattenedHumanName) : HumanName => {
		return {
			use: name.use,
			family: name.family,
			given: [name.given],
			prefix: [name.prefix],
			suffix: [name.suffix]
		}
	}

	const flattenedValue = getFlattenedValue(props.modelValue || {} as HumanName)

	const useItems = [
		{ label: 'official', value: 'official' },
		{ label: 'usual', value: 'usual' },
		{ label: 'temp', value: 'temp' },
		{ label: 'nickname', value: 'nickname' },
		{ label: 'anonymous', value: 'anonymous' },
		{ label: 'old', value: 'old' },
		{ label: 'maiden', value: 'maiden' }
	]

	const update = (event: Event) => {
		const humanName = getHumanName(flattenedValue.value)
		emit('update:modelValue', humanName)
		emit('change', humanName, props.element)
	}
</script>