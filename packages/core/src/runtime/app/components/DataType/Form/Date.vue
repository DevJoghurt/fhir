<template>
	<UPopover
		v-model:open="open"
		:content="{
			align: 'end',
			sideOffset: 8
    	}">
		<DatePickerRoot
				:is-date-unavailable="date => date.day === 19"
				v-model="date"
				@update:model-value="update"
				:locale="df.resolvedOptions().locale"
			>
			<DatePickerField
				v-slot="{ segments }"
				class="w-full flex select-none bg-white items-center rounded-lg text-center justify-between text-green10 border border-gray-300 p-1 data-[invalid]:border-red-500"
			>
				<div class="flex items-center">
				<template
					v-for="item in segments"
					:key="item.part"
				>
					<DatePickerInput
					v-if="item.part === 'literal'"
					:part="item.part"
					>
					{{ item.value }}
					</DatePickerInput>
					<DatePickerInput
					v-else
					:part="item.part"
					class="rounded p-0.5 focus:outline-none focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-green"
					>
					{{ item.value }}
					</DatePickerInput>
				</template>
				</div>

				<UButton color="neutral" @click="open = !open" variant="subtle" icon="i-lucide-calendar" size="xs" />
			</DatePickerField>
		</DatePickerRoot>

		<template #content>
			<UCalendar v-model="date" @update:model-value="update" class="p-2" />
		</template>
	</UPopover>
</template>
<script setup lang="ts">
	import { shallowRef, ref } from '#imports'
	import { DatePickerRoot, DatePickerField, DatePickerInput } from 'reka-ui'
	import { DateFormatter, getLocalTimeZone, today, fromDate } from '@internationalized/date'
	import type { InternalSchemaElement } from '../../../composables/useFhirResource'

	type DateType = {
		_id: string
		value: string
	} | string | null | undefined

	// date modelValue is a string: YYYY, YYYY-MM, or YYYY-MM-DD, or null
	const props = defineProps<{
		modelValue?: DateType
		element: InternalSchemaElement
	}>()

	const emit = defineEmits(['update:modelValue', 'change'])

	const df = new DateFormatter('de', {
		month: '2-digit',
	})
	const open = ref(false)
	const localTimezone = getLocalTimeZone()

	// transform fhir date string to CalendarDate and if null, set to today
	const transformDate = (dateString: string | null) => {
		if (!dateString) return today(localTimezone)
		const dateObject = new Date(Date.parse(dateString))
		return fromDate(dateObject, localTimezone)
	}

	const date = shallowRef(transformDate(
		typeof props.modelValue === 'string'
			? props.modelValue
			: props.modelValue?.value || '')
		)

	// return a string YYYY-MM-DD or null
	const update = () => {
		let dateString = date.value.toString()
		//check if date has timezone added
		if (dateString.includes('T')) {
			// remove timezone from date string
			dateString = dateString.split('T')[0]
		}
		let result = dateString as DateType
		if(typeof props.modelValue === 'object' && props.modelValue !== null) {
			result = { ...props.modelValue, value: dateString }
		}
		emit('update:modelValue', result || null)
		emit('change', result || null, props.element)
	}
</script>