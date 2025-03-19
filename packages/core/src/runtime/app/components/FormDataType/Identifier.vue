<template>
	<div class="border border-gray-200 rounded-sm p-4">
		<div v-for="(identifier, index) in value" :key="index" class="flex space-x-4 space-y-2 items-center">
			<UInput v-model="identifier.system" placeholder="System" class="w-full" />
			<UInput v-model="identifier.value" placeholder="Value" class="w-full" />
			<UButton
				@click="value.splice(index, 1)"
				class="self-start"
				variant="outline"
				color="error"
				size="sm"
				icon="i-heroicons-trash"
				/>

		</div>
		<UButton
			@click="value.push({})"
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

	const value = ref(props.value)
</script>