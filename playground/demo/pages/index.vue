<template>
	<div class="p-8">
		<h1>Index</h1>
		<UCard>
			<template #header>
				<h2>Resource</h2>
			</template>
			<FhirHumanNameDisplay :name="patient?.name" />
		</UCard>
	</div>
</template>
<script lang="ts" setup>
const { readResource } = await useFhir()


const {data: patient} = await  readResource('Patient', '1')
</script>