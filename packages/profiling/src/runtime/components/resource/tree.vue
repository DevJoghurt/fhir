<template>
	<div>
		<TreeRoot
			v-slot="{ flattenItems }"
			class="w-full list-none select-none w-56 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
			:items="transformedItems"
			:get-key="(item) => item.id"
			:default-expanded="defaultExpanded"
		>
			<h2 class="font-normal !text-base text-blackA11 px-2 py-4 pt-1">
				Directory Structure
			</h2>
			<div class="flex py-2 px-2 border rounded-sm bg-gray-100 mb-4">
				<div class="w-[16rem]">Name</div>
				<div class="w-24">Flags</div>
				<div class="w-16">Card.</div>
				<div class="w-36">Type</div>
				<div class="flex-1">Description & Constraints</div>
			</div>
			<TreeItem
				v-for="(item, index) in flattenItems"
				v-slot="{ isExpanded }"
				:key="item._id"
				v-bind="item.bind"
				class="flex w-full my-0.5 outline-none">
				<div
					v-for="i in (item.level-1)"
					class="flex w-4"
					:class="{ 'ml-1.5 border-l-1 border-dashed': index > 0 }">
					<div v-if="i === (item.level-1)" class="w-4 h-3 border-b-1 border-dashed"></div>
					<div class="flex-1"></div>
				</div>
				<div class="h-4 w-4 align-start py-0.5">
					<template v-if="item.hasChildren">
						<Icon
							v-if="!isExpanded"
							name="lucide:circle-plus"
							class="h-4 w-4"
						/>
						<Icon
							v-else
							name="lucide:circle-minus"
							class="h-4 w-4"
						/>
					</template>
					<Icon
						v-else
						:name="item.value.icon || 'lucide:file'"
						class="h-4 w-4"
					/>
				</div>
				<div class="flex min-h-8">
					<div :style="`width: ${17 - (item.level*1.4)}rem;`" class="overflow-hidden pl-2">{{ item.value.title }}</div>
					<div class="w-24">
						<ProfilingFlags :element="item.value" />
					</div>
					<div class="w-16">
						<ProfilingCardinality :element="item.value" />
					</div>
					<div class="w-36">
						<ProfilingType :types="item.value.type" />
					</div>
					<div class="flex-1 text-xs font-normal">
						{{ item.value.short }}
					</div>
				</div>
			</TreeItem>
		</TreeRoot>
	</div>
</template>
<script setup lang="ts">
	import { TreeItem, TreeRoot } from 'radix-vue'
	import { ElementDefinition, StructureDefinition } from '@medplum/fhirtypes'

	type Filter = 'all' | 'mustSupport' | 'extentions'
	type ResourceType = 'differential' | 'snapshot'

	const {
		type = 'snapshot',
		resource = {},
		filter = 'all'
	} = defineProps<{
		type?: ResourceType,
		resource: StructureDefinition,
		filter?: Filter
	 }>()

	// get items based on the type
	const createItems = (item: StructureDefinition, type: ResourceType = 'snapshot'): ElementDefinition[] => {
		const items = [] as ElementDefinition[];

		if (type === 'snapshot') {
			items.push(...item?.snapshot?.element || []);
		}
		if (type === 'differential') {
			items.push(...item?.differential?.element || []);
			// the differential is a diff to the base resource, it mostly does not contain the root element, so we need to add it manually
			if (item?.snapshot?.element[0]) {
				items.unshift(item.snapshot.element[0]);
			}
		}

		return items;
	}

	 // transform the resource into a tree structure
	const transform = (items: ElementDefinition[]): TreeItem[] => {
		const transformedItems = [] as TreeItem[];

		let isRoot = true;

        items.forEach(item => {
            const path = item?.path?.split('.') || [];

			let current = transformedItems;

			for(const cp of path) {
				// check if current path is a extention or a slice
				// these need to be handled differently
				if(cp === 'extension'){
					// If it does not have a sliceName, it is a root extention item TODO: check if it enough
					if(!item.sliceName){
						if(filter === 'all' || filter === 'extentions' || (filter === 'mustSupport' && (item?.mustSupport === true))) {
							current.push({ title: cp, ...item, children: [] });
						}
						break;
					}
					else{
						const index = current.findIndex((item) => item.title === cp);
						if(index !== -1) {
							// gently recognize the filter
							if(filter === 'all' || filter === 'extentions' || (filter === 'mustSupport' && (item?.mustSupport === true))) {
								current[index].children.push({ title: item.sliceName, ...item });
							}
							break;
						}
					}
				}
				// go down the transformation path and add the item
				const index = current.findIndex((item) => item.title === cp);
				if(index === -1) {
					// always add the root element
					if(isRoot || filter === 'all' || (filter === 'mustSupport' && (item?.mustSupport === true))) {
						current.push({ title: cp, ...item });
						isRoot = false;
					}
					break;
				}else{
					if(!current[index]?.children) {
						current[index].children = [];
					}
					current = current[index].children;
				}

			}
        });
        return transformedItems;
    }


	// create default expandables
	const items = createItems(resource, type);
	const defaultExpanded = items.map((element) => element.id) || [];

	const transformedItems = transform(items);
</script>