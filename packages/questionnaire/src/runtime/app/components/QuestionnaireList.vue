<template>
	<section>

	</section>
</template>
<script lang="ts" setup>
	import { useFhir } from '#imports'

	const { search } = useFhir()
	const { data } = await search('Questionnaire')

</script>