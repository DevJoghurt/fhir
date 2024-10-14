<template>
	<div>
		<TreeRoot
			v-slot="{ flattenItems }"
			class="w-full list-none select-none w-56 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
			:items="transform(props.items)"
			:get-key="(item) => item.id"
			:default-expanded="[props.items[0].id]"
		>
			<h2 class="font-semibold !text-base text-blackA11 px-2 py-4 pt-1">
			Directory Structure
			</h2>
			<div class="flex py-2 px-2 border rounded-sm bg-gray-100 mb-4">
				<div class="w-[18.5rem]">Name</div>
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
				<div class="flex pl-2 min-h-8">
					<div :style="`width: ${19 - (item.level*1.4)}rem;`" class="overflow-hidden">{{ item.value.title }}</div>
					<div class="w-24">
						<ProfilingFlags :element="item.value" />
					</div>
					<div class="w-16">
						<ProfilingCardinality :element="item.value" />
					</div>
					<div class="w-36">
						<ProfilingType :types="item.value.type" />
					</div>
					<div class="flex-1">
						{{ item.value.short }}
					</div>
				</div>
			</TreeItem>
		</TreeRoot>
	</div>
</template>
<script setup lang="ts">
	import { defineProps, PropType } from '#imports'
	import { TreeItem, TreeRoot } from 'radix-vue'
	import { ElementDefinition, StructureDefinition } from '@medplum/fhirtypes'

	const props = defineProps({
		items: Array as PropType<ElementDefinition>,
	});

    const transform = (items: ElementDefinition[]): TreeItem => {
        const root: TreeItem = {
			id: 'root',
			children: []
		};
        const itemMap: { [key: string]: TreeItem }[] = [];

        items.forEach(item => {
            const parts = item?.id?.split('.') || [];
            let current = root;

            parts.forEach((part, index) => {
                const id = parts.slice(0, index + 1).join('.');
                if (!itemMap[id]) {
                    const newItem: TreeItem = { title: part, ...item };
                    itemMap[id] = newItem;
					current.children = current.children || [];
                    current.children.push(newItem);
                }
                current = itemMap[id];
            });
        });
        return root.children;
    }
</script>