<template>
	<UCard>
		<UForm id="resourceform" :state="resource" class="space-y-2">
			<UFormField label="Resource Type" name="resourceType">
				<UInput name="resourceType" class="w-full" disabled v-model="resource.resourceType" />
			</UFormField>
			<UFormField label="Id" name="id">
				<UInput name="id" class="w-full" disabled v-model="resource.id" />
			</UFormField>
			<div v-if="profile" class="py-4">
				<template v-for="element in profile.element" :key="element.path">
					<UFormField :label="element.name" :name="element.path">
						<component :is="`FhirFormDataType-${element.type}`" />
					</UFormField>
				</template>
			</div>
		</UForm>
		<template #footer>
			<div class="flex justify-end">
				<UButton>Save</UButton>
			</div>
		</template>
	</UCard>
</template>
<script lang="ts" setup>
	import { computed, reactive, ref, useFhir, useStructureDefinition } from '#imports'

	const props = defineProps<{
		resourceUrl: string
	}>()

	const resourceUrl = ref(props?.resourceUrl || '')

	const structureDefintion = useStructureDefinition()

	const profile = await structureDefintion.loadResource(resourceUrl.value)

	const resource = reactive({
		resourceType: profile?.type || '',
		id: undefined
	})

	console.log(profile)
</script>