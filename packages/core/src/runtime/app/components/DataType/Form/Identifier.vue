<template>
	<div class="border border-gray-200 rounded-sm p-4">
		<div v-for="(identifier, index) in identifiers" :key="index" class="flex space-x-4 space-y-2 items-center">
			<UInput v-model="identifier.system" @change="update" placeholder="System" class="w-full" />
			<UInput v-model="identifier.value" @change="update" placeholder="Value" class="w-full" />
			<UButton
				@click="remove(index)"
				class="self-start"
				variant="outline"
				color="error"
				size="sm"
				icon="i-heroicons-trash"
				/>

		</div>
		<UButton
			@click="identifiers.push({})"
			variant="soft"
			size="sm"
			>Add Identifier</UButton>
	</div>
</template>
<script lang="ts" setup>
	import type { Identifier } from '@medplum/fhirtypes'
	import { ref } from '#imports'

	const props = withDefaults(defineProps<{
		value?: Identifier[]
	}>(), {
		value: () => []
	})

	const emit = defineEmits(['update:modelValue'])

	const identifiers = ref(props.value)

	const remove = (index: number) => {
		emit('update:modelValue', identifiers.value.splice(index, 1))
	}

	const update = (event: Event) => {
		emit('update:modelValue', identifiers.value)
	}
</script>