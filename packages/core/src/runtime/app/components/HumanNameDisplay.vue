<template>
	<div>
		<span>{{ formatHumanName(name, options) }}</span>
	</div>
</template>
<script lang="ts" setup>
	import type { HumanName } from '@medplum/fhirtypes'
	import { formatHumanName, type HumanNameFormatOptions } from '../utils'

	const props = defineProps<{
		name?: HumanName | HumanName[]
		options?: HumanNameFormatOptions
	}>()

	let name = props.name
	if (name && Array.isArray(name)) {
		name = name[0]
	}

</script>