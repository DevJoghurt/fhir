<template>
	<li
	  class="rounded-md underline-offset-4 transition-all [&:not(:first-child)]:pt-3"
	  :class="[level > 0 && 'pl-4']"
	>
	  <UCollapsible v-if="link.children" v-model:open="isOpen">
		<UButton
			variant="ghost"
			color="neutral"
			class="w-full text-left"
			>
		  <div class="flex w-full gap-1">
			<UIcon
			  v-if="link.icon"
			  :name="link.icon"
			  class="mr-1 w-8 self-center"
			/>
			<span class="truncate text-nowrap">
			  {{ link.title }}
			</span>
			<UIcon
			  name="lucide:chevron-down"
			  class="ml-auto self-center transition-transform"
			  :class="[!isOpen && '-rotate-90']"
			/>
		  </div>
		</UButton>
		<template #content>
		  <LayoutAsideTree :links="link.children" :level="level + 1" />
		</template>
	  </UCollapsible>
	  <NuxtLink
		v-else
		:to="link._path"
		class="flex w-full gap-1 text-muted-foreground hover:underline"
		:class="[isActive && 'font-medium text-primary']"
	  >
		<UIcon
		  v-if="link.icon"
		  :name="link.icon"
		  class="mr-1 w-8 self-center"
		/>
		<span class="truncate text-nowrap">
		  {{ link.title }}
		</span>
	  </NuxtLink>
	</li>
</template>
<script setup lang="ts">
  import type { NavItem } from '@nuxt/content';
  import { useConfig, useCollapsedMap, ref, watch, computed, useRoute } from '#imports';

  const props = defineProps<{
	link: NavItem;
	level: number;
  }>();

  const { collapse } = useConfig().value.aside;

  const collapsed = useCollapsedMap();
  const isOpen = ref(collapsed.value.get(props.link._path) || (props.level < 1 && !collapse));
  watch(isOpen, (v) => {
	collapsed.value.set(props.link._path, v);
  });
  const isActive = computed(() => props.link._path === useRoute().path);
</script>