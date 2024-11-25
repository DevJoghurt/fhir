<template>
	<div class="flex flex-col">
		<div v-for="(t, index) in type" :key="index" class="mb-2">
			<div v-if="isExtension(t)">
				<div v-if="t.code==='Extension'">
					<NuxtLink v-for="profile of t.profile" :to="profile" :external="true" target="_blank" class="type-code font-bold underline">{{ t.code }}</NuxtLink>
				</div>
				<div v-else-if="t?.extension && t.extension.length>0">
					<NuxtLink v-for="ext of t.extension" :to="ext.url" :external="true" target="_blank" class="type-code font-bold underline">{{ ext.valueUrl }}</NuxtLink>
				</div>
			</div>
			<div v-else-if="isReference(t)">
				<span class="type-code font-bold">{{ t.code }}</span>
				<div v-if="t.targetProfile" class="text-xs font-thin">
					(<span v-for="(tp,index) of t.targetProfile">{{ transformTargetProfile(tp) }}<span v-if="index<(t.targetProfile.length-1)">, </span></span>)
				</div>
			</div>
			<span class="type-code font-bold" v-else>{{ t.code }}</span>
		</div>
	</div>
</template>
<script setup lang="ts">
	import type { PropType } from '#imports'
	import type { ElementDefinitionType } from '@medplum/fhirtypes'

	defineProps({
		type: Object as PropType<ElementDefinitionType[]>,
	})

	const isValidUrl = (urlString: string) => {
      try {
          return Boolean(new URL(urlString));
      }
      catch(e){
          return false;
      }
  	}

	const transformTargetProfile = (targetProfile: string) => {
		if(isValidUrl(targetProfile)){
			// strip the url to only show the last part
			return targetProfile.split('/').pop();
		}
		return ''
	}

	const isReference = (type: ElementDefinitionType) => {
		return type.code === 'Reference' && (type.targetProfile && type.targetProfile.length>0)
	}

	const isExtension = (type: ElementDefinitionType) => {
		return type.code === 'Extension' || (type.extension && type.extension.length>0)
	}
</script>