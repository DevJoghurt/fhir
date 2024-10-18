<template>
	<UModal>
		<template v-if="enable">
			<UButton
				v-if="style === 'input'"
				variant="outline"
				class="h-8 w-full self-center rounded-md pr-1.5 font-normal text-muted-foreground hover:text-accent-foreground"
				:class="[inAside ? 'mb-4' : 'md:w-40 lg:w-64']"
				:ui="{
					leadingIcon: 'lucide:search'
				}"
				@click="isOpen = true"
			>
				<span class="mr-auto overflow-hidden">
				{{ placeholder }}
				</span>
				<UKbd class="ml-auto hidden md:block">
				<span class="text-xs">⌘</span>K
				</UKbd>
			</UButton>
			<UButton
				v-else
				variant="ghost"
				size="icon"
				@click="isOpen = true"
			>
				<Icon name="lucide:search" size="16" />
			</UButton>
		</template>
		<template #content>
			<UCommandPalette
			v-model:search-term="searchTerm"
			:loading="searchLoading"
			:groups="groups"
			placeholder="Search docs..."
			class="h-80"
			/>
	  	</template>
	</UModal>
</template>
<script setup lang="ts">
	import { useConfig, useContent, useContentHelpers, watch, searchContent, ref, navigateTo } from '#imports';

	const { enable, inAside, style, placeholder, placeholderDetailed } = useConfig().value.search;

	const { navKeyFromPath } = useContentHelpers();
	const { navigation } = useContent();

	function getItemIcon(path: string) {
		return navKeyFromPath(path, 'icon', navigation.value);
	}

	const searchTerm = ref('');
	const searchLoading = ref(false);
	const searchResult = ref();

	watch(
		searchTerm,
		async (v) => {
			if (!v)
			return;

			searchLoading.value = true;
			searchResult.value = (await searchContent(v)).value;
			searchLoading.value = false;
	});

	async function handleEnter() {
		if (searchResult.value[activeSelect.value]?.id) {
			await navigateTo(searchResult.value[activeSelect.value].id);
			open.value = false;
		}
	}
</script>