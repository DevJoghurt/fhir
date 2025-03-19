<template>
	<div class="border border-gray-200 rounded-sm p-4">
		<div v-for="(name, index) in flattenedValue" :key="index" class="flex space-x-4 space-y-2 items-center">
			<USelect v-model="name.use" @change="update" :items="useItems" class="w-72" />
			<UInput v-model="name.family" @change="update" placeholder="Family" class="w-full" />
			<UInput v-model="name.given" @change="update" placeholder="Given" class="w-full" />
			<UInput v-model="name.prefix" @change="update" placeholder="Prefix" class="w-full" />
			<UInput v-model="name.suffix" @change="update" placeholder="Suffix" class="w-full" />
			<UButton
				@click="removeName(index)"
				class="self-start"
				variant="outline"
				color="error"
				size="sm"
				icon="i-heroicons-trash"
				/>

		</div>
		<UButton
			@click="addName()"
			variant="soft"
			size="sm"
			>Add Name</UButton>
	</div>
</template>
<script lang="ts" setup>
	import type { HumanName } from '@medplum/fhirtypes'
	import { ref } from '#imports'
	import type { Ref } from 'vue'

	type FlattenedHumanName = {
		use: string
		family: string
		given: string
		prefix: string
		suffix: string
	}

	const props = withDefaults(defineProps<{
		modelValue?: HumanName[]
		isArray?: boolean
	}>(), {
		modelValue: () => [],
		isArray: false
	})

	const emit = defineEmits(['update:modelValue'])

	const getFlattenedValue = (data: HumanName[]) : Ref<FlattenedHumanName[]> => {
		const flattenedData = data.map((name) => {
				return {
					use: name.use || 'official',
					family: name.family || '',
					given: name?.given?.length && name?.given?.length > 0 ? name.given[0] : '',
					prefix: name?.prefix?.length && name?.prefix?.length > 0 ? name.prefix[0] : '',
					suffix: name?.suffix?.length && name?.suffix?.length > 0 ? name.suffix[0] : ''
				}
		}) as FlattenedHumanName[]

		return ref(flattenedData)
	}

	const getHumanNames = (data: FlattenedHumanName[]) : HumanName[] => {
		const humanNames = data.map((name) => {
			return {
				use: name.use,
				family: name.family,
				given: [name.given],
				prefix: [name.prefix],
				suffix: [name.suffix]
			}
		}) as HumanName[]

		return humanNames
	}

	const flattenedValue = getFlattenedValue(props.modelValue)

	const useItems = [
		{ label: 'official', value: 'official' },
		{ label: 'usual', value: 'usual' },
		{ label: 'temp', value: 'temp' },
		{ label: 'nickname', value: 'nickname' },
		{ label: 'anonymous', value: 'anonymous' },
		{ label: 'old', value: 'old' },
		{ label: 'maiden', value: 'maiden' }
	]

	const addName = () => {
		flattenedValue.value.push({
			use: 'official',
			family: '',
			given: '',
			prefix: '',
			suffix: ''
		})
	}

	const removeName = (index: number) => {
		flattenedValue.value.splice(index, 1)
		const humanNames = getHumanNames(flattenedValue.value)
		emit('update:modelValue', humanNames)
	}

	const update = (event: Event) => {
		const humanNames = getHumanNames(flattenedValue.value)
		emit('update:modelValue', humanNames)
	}
</script>