<template>
	<div>
		<h1>Playground</h1>
		<UInput />
	</div>
</template>
<script setup lang="ts">
	const { medplum, profile } = useMedplum()

	const patient = await medplum.readResource('Patient', '5b9ccabf-5ec2-4d36-baf4-815f6ca6d243');

	console.log(profile.value);
</script>