<template>
	<UNavigationMenu :items="nav" class="justify-center" />
</template>
<script setup lang="ts">
  import { useConfig } from '#imports';

  const { nav } = useConfig().value.header;
</script>