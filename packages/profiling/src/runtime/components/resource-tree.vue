<template>
	<div>
		<TreeRoot
			v-slot="{ flattenItems }"
			class="list-none select-none w-56 bg-white text-blackA11 rounded-lg p-2 text-sm font-medium"
			:items="transformedItems.children"
			:get-key="(item) => item.title"
			:default-expanded="['components']"
		>
			<h2 class="font-semibold !text-base text-blackA11 px-2 pt-1">
			Directory Structure
			</h2>
			<TreeItem
				v-for="item in flattenItems"
				v-slot="{ isExpanded }"
				:key="item._id"
				:style="{ 'padding-left': `${item.level - 0.5}rem` }"
				v-bind="item.bind"
				class="flex items-center py-1 px-2 my-0.5 rounded outline-none focus:ring-grass8 focus:ring-2 data-[selected]:bg-grass4"
			>
				<template v-if="item.hasChildren">
					<Icon
						v-if="!isExpanded"
						name="lucide:folder"
						class="h-4 w-4"
					/>
					<Icon
						v-else
						name="lucide:folder-open"
						class="h-4 w-4"
					/>
				</template>
				<Icon
					v-else
					:name="item.value.icon || 'lucide:file'"
					class="h-4 w-4"
				/>
				<div class="pl-2">
					{{ item.value.title }}
				</div>
			</TreeItem>
		</TreeRoot>
	</div>
</template>
<script setup lang="ts">
	import { TreeItem, TreeRoot } from 'radix-vue'
	import { ElementDefinition } from '@medplum/fhirtypes'

	const props = defineProps({
		items: Array as PropType<ElementDefinition>,
	})

    const transform = (items: ElementDefinition[]): TreeItem => {
        const root: TreeItem = {
			id: 'root',
			children: []
		};
		const data = [];
        const itemMap: { [key: string]: TreeItem }[] = [];

        items.forEach(item => {
            const parts = item.id.split('.');
            let current = root;

            parts.forEach((part, index) => {
                const id = parts.slice(0, index + 1).join('.');
                if (!itemMap[id]) {
                    const newItem: TreeItem = { id, title: part ,children: [] };
                    itemMap[id] = newItem;
                    current.children.push(newItem);
                }
                current = itemMap[id];
            });
        });

        return root;
    }

	const transformedItems = transform(props.items);
</script>