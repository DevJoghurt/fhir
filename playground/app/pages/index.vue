<template>
	<div>
		<h1>Playground</h1>
		<UInput />
		<NuxtLink to="/login">Login</NuxtLink>
	</div>
</template>
<script setup lang="ts">
	import { useMedplum } from '#imports';

	const { medplum } = useMedplum();

	//const patient = await medplum.readResource('Patient', '5b9ccabf-5ec2-4d36-baf4-815f6ca6d243');
	//console.log(patient.name[0].given[0]);
</script>