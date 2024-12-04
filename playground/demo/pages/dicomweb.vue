<template>
	<div class="p-8">
		<h1 class="mb-2">Dicom Web</h1>
		<div>
			<UCard>

			</UCard>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { useDicomWeb } from '#imports'

	const { getStudies } = useDicomWeb()

	const studies = await getStudies();

	console.log(studies)
</script>