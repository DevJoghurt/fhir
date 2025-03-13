<template>
	<div class="w-full space-y-4 pb-4">
	  	<UTable
			ref="table"
			:data="items"
			:columns="columns"
			:loading="status === 'pending'"
			loading-color="primary"
			class="flex-1" />
	  	<div class="flex justify-between border-t border-(--ui-border) px-4 py-4">
			<UPagination
				:default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
				:items-per-page="table?.tableApi?.getState().pagination.pageSize"
				:total="table?.tableApi?.getFilteredRowModel().rows.length"
				@update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
			/>
    	</div>
	</div>
</template>
<script lang="ts" setup>
	import { useFhir, computed, useTemplateRef, ref, h } from '#imports'
	import { formatHumanName, formatDateTime, isHumanName } from '../../utils'
	import type { FhirResource } from '../../types'
	import type { TableColumn } from '@nuxt/ui'
	import type { HumanName, Meta, Identifier } from '@medplum/fhirtypes'
	import { UDropdownMenu, UButton } from '#components'

	const props = defineProps<{
		resourceType: FhirResource
	}>()

	const table = useTemplateRef('table')

	const pagination = ref({
		pageIndex: 0,
		pageSize: 5
	})

	const resource = ref(props.resourceType)

	const { search } = useFhir()

	const { data, status } = await search(resource.value)

	const items = computed(() => data.value?.entry?.map((entry: any) => {
		const {resourceType, ...item} = entry.resource
		return item
	}) ?? [])

	// Create columns based on the mapping columns

	const defaultMappingColumns = {
		Patient: ['id', 'name', 'meta'],
		Practitioner: ['id', 'name', 'meta'],
		Organization: ['id', 'identifier', 'name', 'meta'],
		Location: ['id', 'identifier', 'name', 'meta'],
		PractitionerRole: ['id', 'identifier', 'name', 'meta'],
		HealthcareService: ['id', 'identifier', 'name', 'meta'],
		Endpoint: ['id', 'identifier', 'name', 'meta'],
		ResearchStudy: ['id', 'identifier', 'title', 'meta'],
		ResearchSubject: ['id', 'identifier', 'title', 'meta'],
		StructureDefinition: ['id', 'name', 'meta'],
		ImagingStudy: ['id', 'identifier', 'meta'],
		ImplementationGuide: ['id', 'name', 'title', 'meta'],
		default: ['id', 'meta']
	} as Record<FhirResource | 'default', string[]>

	const mappingColumns = defaultMappingColumns[resource.value] || defaultMappingColumns['default']

	const columns = mappingColumns.map(key => {
			const header = key === 'meta' ? 'Last Updated' : key.charAt(0).toUpperCase() + key.slice(1)
			const column: TableColumn<any> = {
				accessorKey: key,
				header: header,
				cell: ({ row }) => {
					if (key === 'meta') {
						const meta = row.getValue('meta') as Meta
						return formatDateTime(meta?.lastUpdated, 'de-DE', {
							dateStyle: 'short',
							timeStyle: 'medium'
						})
					}
					if (key === 'name') {
						const name = row.getValue('name') as HumanName[]
						if (isHumanName(name)) {
							return formatHumanName(name)
						}
						if(typeof name === 'string') {
							return name
						}
						return ''
					}
					if (key === 'identifier') {
						const identifier = row.getValue('identifier') as Identifier[]
						if (identifier[0]) {
							return identifier[0].value || identifier[0].id || identifier[0].system || ''
						}
						return ''
					}
					return row.getValue(key)
				}
			}
			return column
	}) as TableColumn<any>[]

	columns.push({
		id: 'actions',
		cell: ({ row }) => {
			return h(
			'div',
			{ class: 'text-right' },
			h(UDropdownMenu, {
				content: {
					align: 'end',
				},
				items: [{
					label: 'Details',
					onSelect: () => {},
				}, {
					label: 'Delete',
					onSelect: () => {

					},
				}],
				},
				() =>
				h(UButton, {
					icon: 'i-lucide-ellipsis-vertical',
					color: 'neutral',
					variant: 'ghost',
					class: 'ml-auto cursor-pointer',
				}),
			),
			)
		}
	})
</script>