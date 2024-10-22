<template>
	<UiScrollArea orientation="vertical" class="relative h-full overflow-hidden py-6 pr-6 text-sm" type="hover">
	  <LayoutHeaderNavMobile v-if="isMobile" class="mb-5 border-b pb-2" />
	  <LayoutSearchButton v-if="config.search.inAside" />
	  <ul v-if="config.aside.useLevel" class="flex flex-col gap-1 border-b pb-4">
		<li v-for="link in filteredNavigation" :key="link.id">
		  <NuxtLink
			:to="link?._path || ''"
			class="flex h-8 items-center gap-2 rounded-md p-2 text-sm text-foreground/80 hover:bg-muted hover:text-primary"
			:class="[
			  path?.startsWith(link?._path) && 'bg-muted !text-primary',
			]"
		  >
			<UIcon
			  v-if="link.icon"
			  :name="link.icon"
			  class="w-4 self-center"
			/>
			{{ link.title }}
		  </NuxtLink>
		</li>
	  </ul>
	  <LayoutAsideTree :links="tree" :level="0" class="px-3" :class="[config.aside.useLevel ? 'pt-4' : 'pt-1']" />
	</UiScrollArea>
</template>
<script setup lang="ts">
  import {
		useContentHelpers,
		useContent,
		useConfig,
		computed,
		useRoute,
	} from '#imports';

  defineProps<{ isMobile: boolean }>();

  const { navDirFromPath } = useContentHelpers();
  const { navigation } = useContent();
  const config = useConfig();

  // Filter profiling resources from navigation
  const filteredNavigation = computed(() => {
	return navigation.value.filter((item) => {
	  return !item._path.startsWith('/profiling');
	});
  });

  const tree = computed(() => {
	const route = useRoute();
	const path = route.path.split('/');
	if (config.value.aside.useLevel) {
	  const leveledPath = path.splice(0, 2).join('/');

	  const dir = navDirFromPath(leveledPath, navigation.value);
	  return dir ?? [];
	}
	return filteredNavigation.value;
  });

  const path = computed(() => useRoute()?.path);
</script>