<template>
	<div>
		<div class="flex justify-between items-center mb-4">

		</div>
		<div class="w-full space-y-4 pb-4">
			<UTable
				ref="table"
				v-model:pagination="pagination"
				:data="items || []"
				:columns="columns || []"
				:loading="status === 'pending'"
				loading-color="primary"
				:pagination-options="{
        			getPaginationRowModel: getPaginationRowModel(),
					manualPagination: true,
					rowCount: data?.total || 0,
      			}"
				class="flex-1">
				<template #id-cell="{ row }">
					<ULink @click="emit('select', row.original)" class="cursor-pointer">{{ row.getValue('id') }}</ULink>
				</template>
				<template #name-cell="{ row }">
					<ULink @click="emit('select', row.original)" class="cursor-pointer">{{ formatName(row.getValue('name')) }}</ULink>
				</template>
				<template #actions-cell="{ row }">
					<UDropdownMenu
						:content="{
							align: 'end',
						}",
						:items="[
							{
								label: 'Details',
								onSelect: () => emit('select', row.original)
							},
							{
								label: 'Delete',
								onSelect: () => emit('delete', row.original)
							}
						]"
					>
						<UButton
							icon="i-lucide-ellipsis-vertical"
							color="neutral"
							variant="ghost"
							class="ml-auto cursor-pointer"
						/>
					</UDropdownMenu>

				</template>
			</UTable>
			<div class="h-10"></div>
			<div class="fixed bottom-0 bg-neutral-50 w-full flex justify-between border-t border-(--ui-border) px-4 py-2">
				<UPagination
					:page="(table?.tableApi?.getState().pagination.pageIndex || 1)"
					:default-page="(table?.tableApi?.getState().pagination.pageIndex || 1)"
					:items-per-page="table?.tableApi?.getState().pagination.pageSize"
 					:total="data?.total || 0"
					@update:page="setPagination"
				/>
			</div>
		</div>
	</div>
</template>
<script lang="ts" setup>
	import { useFhirClient, computed, useTemplateRef, ref, h, formatHumanName, formatDateTime, isHumanName, useRoute, useRouter } from '#imports'
	import { getPaginationRowModel } from '@tanstack/vue-table'
	import type { TableColumn } from '@nuxt/ui'
	import type { HumanName, Meta, Identifier, Resource, ResourceType } from '@medplum/fhirtypes'
	import { UDropdownMenu, UButton } from '#components'

	const props = defineProps<{
		resourceType: ResourceType
	}>()

	const emit = defineEmits<{
		(e: 'select', resource: Resource): void;
		(e: 'delete', resource: Resource): void;
	}>()

	const table = useTemplateRef('table')

	const resource = ref(props.resourceType)

	const { search } = useFhirClient()

	const route = useRoute()
	const router = useRouter()

	const pagination = ref({
		pageIndex: route.query.page ? parseInt(route.query.page as string) : 0,
		pageSize: 20
	})
	const pageSize = computed(() => pagination.value.pageSize)
	const offset = computed(() => {
		if(pagination.value.pageIndex === 0) {
			return 0
		}
		return (pagination.value.pageIndex - 1) * pageSize.value
	})

	const setPagination = (pageIndex: number) => {
		table.value?.tableApi?.setPageIndex(pageIndex)
		router.replace({
				query: {
				...route.query,
				page: pageIndex,
			},
  		})
	}

	const { data, status } = await search(resource.value, {
		_count: pageSize,
		_offset: offset,
		_total: "accurate"
	}, {
		watch: [pagination],
	})

	const items = computed(() => data.value?.entry?.map((entry: any) => {
		const {resourceType, ...item} = entry.resource
		return {
			...item
		}
	}) ?? [])

	// Create columns based on the mapping columns

	const defaultMappingColumns = {
		CodeSystem: ['id', 'name', 'meta'],
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
	} as Record<ResourceType | 'default', string[]>

	const mappingColumns = defaultMappingColumns[resource.value] || defaultMappingColumns['default']

	const formatName = (name: HumanName[] | string) => {
		if (isHumanName(name)) {
			return formatHumanName(name)
		}
		if(typeof name === 'string') {
			return name
		}
		return ''
	}

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
						return formatName(name)
					}
					if (key === 'identifier') {
						const identifier = row.getValue('identifier') as Identifier[]
						if (identifier && identifier[0]) {
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
		accessorKey: 'actions',
		header: 'Actions'
	})
</script>