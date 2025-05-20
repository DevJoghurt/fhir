<template>
	<div class="border border-gray-200 rounded-sm p-4">
		<div class="flex flex-col space-x-4 space-y-2 pb-2">
			<template
				v-for="(val, index) in elementValue"
				:key="val?._id || index">
					<div class="w-full border border-gray-200 rounded-sm p-4">
						<div class="flex w-full"
							:class="{
								'flex-col space-y-4': element.type === 'BackboneElement',
								'flex-row space-x-4': element.type !== 'BackboneElement'
							}"
							>
							<FhirDataTypeFormBackboneElement
								v-if="element.type === 'BackboneElement'"
									v-model="elementValue[index]"
									@change="update"
									:nestedElements="nestedElements"
							/>
							<component
								v-else
									:is="`FhirDataTypeForm-${element.type}`"
									v-model="elementValue[index]"
									@change="update"
									:element="element"
							/>
							<UButton
								@click="removeArrayItem(index)"
								class="self-start"
								variant="outline"
								color="error"
								size="sm"
								icon="i-heroicons-trash"
							/>
						</div>
					</div>
			</template>
		</div>
		<UButton
			@click="addArrayItem()"
			variant="soft"
			size="sm"
			>Add Item</UButton>
	</div>
</template>
<script lang="ts" setup>
	import { computed } from '#imports'
	import type { InternalSchemaElement } from '../../../../composables/useFhirResource'

	const props = defineProps<{
		modelValue?: any,
		element: InternalSchemaElement,
	}>()
	const emit = defineEmits(['update:modelValue', 'change'])

	const nestedElements = [] as InternalSchemaElement[]
	if (props.element.type === 'BackboneElement') {
		nestedElements.push(...props.element.element || [])
	}

	// add id to each element in the array
	const elementValue = computed(() => {
		if (Array.isArray(props.modelValue)) {
			return props.modelValue.map((item) => {
				if (typeof item === 'object' && item !== null) {
					item._id = Math.random().toString(36).substring(2, 15)
				}
				// if it is not an BackboneElement, transform the value to an object
				if (props.element.type !== 'BackboneElement' && ((typeof item !== 'object') || item === null)) {
					return {
						_id: Math.random().toString(36).substring(2, 15),
						value: item || null
					}
				}
				return item
			})
		}
		return []
	})

	const removeArrayItem = (index: number) => {
		// update keys for each element in the array
		elementValue.value.splice(index, 1)
		update()
	}

	const addArrayItem = () => {
		elementValue.value.push({
			_id: Math.random().toString(36).substring(2, 15)
		})
		update()
	}

	const update = () => {
		// copy elementValue to a new array to avoid reference issues
		// TODO: evaluate if this can be a problem in FHIR datatypes
		const data = JSON.parse(JSON.stringify(elementValue.value))
		// remove id from each element in the array
		data.forEach((item, index) => {
			if (typeof item === 'object' && item !== null) {
				delete item._id
			}
			// if it is not an BackboneElement, re-transform the object to an flat array
			if (props.element.type !== 'BackboneElement') {
				data[index] = item?.value || null
			}
		})
		emit('update:modelValue', data)
		emit('change', data, props.element)
	}
</script>
