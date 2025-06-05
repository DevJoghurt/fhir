<template>
	<UCard :ui="{
		root: 'rounded-none',
		header: 'p-2 bg-gray-100'
	}">
		<template #header>
			<h1 class="text-sm font-bold">Resource Meta</h1>
		</template>
		<div v-if="!resource">
			<p>Loading...</p>
		</div>
		<div v-else class="flex flex-col gap-2 text-xs">
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Last Updated:</p>
				<NuxtTime
					:datetime="resource?.meta?.lastUpdated"
					year="numeric"
					month="numeric"
					day="numeric"
					hour="2-digit"
					minute="2-digit"
					second="2-digit" />
			</div>
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Version ID:</p>
				<div>{{ resource.meta?.versionId }}</div>
			</div>
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Security:</p>
				<ul>
					<li v-for="tag in resource.meta?.security" :key="tag.code">{{ tag.code }} - {{ tag.display }}</li>
				</ul>
			</div>
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Source:</p>
				<FhirDataTypeDisplayUri :value="resource.meta?.source" />
			</div>
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Tags:</p>
				<ul>
					<li v-for="tag in resource.meta?.tag" :key="tag.code">{{ tag.code }} - {{ tag.display }}</li>
				</ul>
			</div>
			<div class="flex">
				<p class="flex-1 text-sm font-bold">Profile:</p>
				<ul>
					<li v-for="profile in resource.meta?.profile" :key="profile">{{ profile }}</li>
				</ul>
			</div>
		</div>
	</UCard>
</template>
<script lang="ts" setup>
	import type { Resource } from '@medplum/fhirtypes'

	defineProps<{
		resource?: Resource | null
	}>()
</script>