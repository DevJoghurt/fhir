<template>
	<UInput
		name="uri"
		class="w-full"
		v-model="uri"
		@change="() => emit('update:modelValue', uri)"
		/>
</template>
<script setup lang="ts">
	import { ref } from '#imports'

	const uri = ref<string>('')

	const emit = defineEmits(['update:modelValue'])
	//TODO validate URI
</script>