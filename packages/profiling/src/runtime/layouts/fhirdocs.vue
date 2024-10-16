<template>
	<div>
		<header class="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50">
			<div class="mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-24">
				<div class="lg:flex-1 flex items-center gap-1.5">
					<NuxtLink to="/docs">
						<img src="/nhealth_light.png" class="h-16" alt="FHIR logo" />
					</NuxtLink>
				</div>
				<div class="items-center gap-x-8 hidden lg:flex">
					<h1>Fhir Docs Menu</h1>
				</div>
				<div class="flex items-center justify-end lg:flex-1 gap-1.5">

				</div>
			</div>
		</header>
		<slot />
	</div>
</template>
<script setup lang="ts">

</script>