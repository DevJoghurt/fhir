<template>
	<div class="p-8">
		<h1>Index</h1>
		<UCard>
			<template #header>
				<h2>Resource</h2>
			</template>
			<div v-for="patient in patients.entry" class="mb-4">

				<FhirHumanNameDisplay :name="patient?.resource?.name" />
			</div>
		</UCard>
	</div>
</template>
<script lang="ts" setup>

	const { search } = useFhirClient()


	const patients = await search('Patient')

</script>