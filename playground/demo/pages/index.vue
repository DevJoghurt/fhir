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

const {data: patient} = await  readResource('Patient', 'bf70d17f-0f3c-48c4-8b64-61e5a48e1c2a')
</script>