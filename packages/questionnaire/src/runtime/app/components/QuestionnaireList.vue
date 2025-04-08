<template>
	<section>

	</section>
</template>
<script lang="ts" setup>
	import { useFhirClient } from '#imports'

	const { search } = useFhirClient()
	const { data } = await search('Questionnaire')

</script>