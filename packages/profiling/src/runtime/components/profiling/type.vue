<template>
	<div class="flex flex-col">
		<div v-for="(type, index) in types" :key="index" class="mb-2">
			<span class="type-code font-bold" v-if="!isValidUrl(type.code) && type.code!=='Extension'">{{ type.code }}</span>
			<div v-else-if="!isValidUrl(type.code) && type.code==='Extension'">
				<NuxtLink v-for="profile of type.profile" :to="profile" :external="true" class="type-code font-bold underline">{{ type.code }}</NuxtLink>
			</div>
			<div v-else>
				<div v-if="type.extension.length>0">
					<NuxtLink v-for="ext of type.extension" :to="ext.url" :external="true" class="type-code font-bold underline">{{ ext.valueUrl }}</NuxtLink>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
	import { defineProps, PropType } from '#imports'
	import { ElementDefinitionType } from '@medplum/fhirtypes'

	defineProps({
		types: Array as PropType<ElementDefinitionType>,
	})

	const isValidUrl = urlString=> {
      try {
          return Boolean(new URL(urlString));
      }
      catch(e){
          return false;
      }
  	}
</script>