<template>
	<div>
		<NuxtLoadingIndicator :color="false" class="z-100 bg-primary/80" />
		<UApp>
			<LayoutHeader />
			<div class="mx-auto max-w-[1536px] p-6 min-h-screen border-b">
				<div
				class="flex-1 items-start px-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10"
				:class="[config.main.padded && 'container']"
				>
					<aside class="fixed top-[102px] z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto md:sticky md:top-[60px] md:block">
						<LayoutAside :is-mobile="false" />
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