<template>
    <UDropdownMenu
      :items="items"
      :content="{
          side: 'top'
      }">
        <div class="flex w-full py-3 px-1 items-center cursor-pointer">
          <UAvatar class="flex-none" src="/placeholder_profile_square.jpg" />
          <div class="flex-auto text-sm font-normal px-2">
              User Name
          </div>
          <div class="flex-1 flex justify-end">
            <UIcon class="self-end" name="i-heroicons-ellipsis-vertical" />
          </div>
        </div>

        <template #account="{item}">
            <div class="text-left">
                <p>{{ t('profile.dropdownSignedInAs') }}</p>
                <p class="truncate font-medium text-gray-900 dark:text-white">
                    {{ t('auth.email') }}: {{ item.label }}
                </p>
            </div>
        </template>

        <template #item="{ item }">
            <span v-if="item.type === 'label'" class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</span>
            <span v-else class="truncate">{{ item.t ? t(item.t) : item.label || '' }}</span>
            <UIcon v-if="item.icon" :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto" />
        </template>
    </UDropdownMenu>
</template>
<script setup lang="ts">
    import { useI18n, useAppConfig } from '#imports'
    import type { DropdownMenuItem } from '#ui/types'
    import type { AppConfig } from '@nuxt/schema'

    interface Item  extends DropdownMenuItem {
      slot?: 'account'
      action?: 'signout' | 'link'
      icon?: string
      t?: string
      disabled?: boolean
    }

    const appConfig = useAppConfig() as AppConfig

    const items = [
      [{
        label: 'Test',
        slot: 'account',
        type: 'label'
      }],
        appConfig.navigation.dropdownProfile.items,
      [{
        label: 'Sign out',
        action: 'signout',
        icon: 'i-heroicons-arrow-left-on-rectangle'
      }]
    ] as [Item][]

    const { t } = useI18n()
</script>