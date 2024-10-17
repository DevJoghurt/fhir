<template>
	<div>
		<NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
		<UApp>
			<header class="bg-background/75 backdrop-blur border-b border-gray-200 dark:border-gray-800 -mb-px sticky top-0 z-50">
				<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-20">
					<div class="lg:flex-1 flex items-center gap-1.5">
						<NuxtLink to="/docs">
							<img src="/nhealth_light.png" class="h-14" alt="FHIR logo" />
						</NuxtLink>
					</div>
					<div class="items-center gap-x-8 hidden lg:flex-1">
					</div>
					<div class="flex items-center justify-end lg:flex-1 gap-1.5">

					</div>
				</div>
			</header>
			<div class="min-h-screen border-b">
				<div
				class="flex-1 items-start px-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10"
				:class="[config.main.padded && 'container']"
				>
					<aside class="fixed top-[102px] z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto md:sticky md:top-[60px] md:block">

					</aside>
					<slot />
				</div>
			</div>
		</UApp>
	</div>
</template>
<script setup lang="ts">
	import { useConfig } from '#imports';

	const config = useConfig();
</script>