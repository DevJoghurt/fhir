<template>
	<UBreadcrumb
    :items="breadcrumbs"
  />
</template>
<script setup lang="ts">
  import { useRoute, computed, useBreadcrumb } from '#imports';
  const route = useRoute();

  const breadcrumbs = computed(() => useBreadcrumb(route.path));
</script>