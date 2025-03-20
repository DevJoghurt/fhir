<template>
	<div>{{ formatHumanName(value) }}</div>
</template>
<script setup lang="ts">
	import type { HumanName } from '@medplum/fhirtypes'
	import { formatHumanName } from '../../../../utils/format'
	defineProps<{
		value: HumanName[] | []
	}>()
</script>