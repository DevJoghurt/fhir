<template>
	<UBreadcrumb
    :items="breadcrumbs"
  />
</template>
<script setup lang="ts">
  const route = useRoute();

  const breadcrumbs = computed(() => useBreadcrumb(route.path));
</script>