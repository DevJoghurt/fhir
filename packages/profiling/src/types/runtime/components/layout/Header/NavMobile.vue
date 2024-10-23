<template>
	<div>
	  <LayoutHeaderNavMobileItem
		v-for="(item, i) in nav"
		:key="i"
		:item="item"
		:index="i"
	  />
	</div>
</template>
<script setup lang="ts">
	import { useConfig } from '#imports';
  	const { nav } = useConfig().value.header;
</script>