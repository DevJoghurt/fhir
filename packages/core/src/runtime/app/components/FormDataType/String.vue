<template>
	<UInput
		name="uri"
		class="w-full"
		v-model="string"
		@change="() => emit('update:modelValue', string)"
		/>
</template>
<script setup lang="ts">
	import { ref } from '#imports'

	const string = ref<string>('')
</script>