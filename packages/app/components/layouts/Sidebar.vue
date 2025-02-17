<template>
    <section>
		<UApp>
			<div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
				<div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
				<div class="flex h-16 py-4 shrink-0 items-center">
					<slot name="logo">
						<NuxtLink to="/">
							<Logo class="h-12" alt="Logo"></Logo>
						</NuxtLink>
					</slot>
				</div>
				<nav class="flex flex-1 flex-col">
					<div>
						<UNavigationMenu :orientation="'vertical'" :items="[items]" />
					</div>
					<div class="mt-auto">
						<!--TODO add menu at the bottom-->
					</div>
				</nav>
				</div>
			</div>
			<div class="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
				<UButton
					icon="i-heroicons-bars-3"
					size="sm"
					color="primary"
					square
					variant="outline"
				/>
			</div>
			<div class="lg:pl-72">
				<main>
					<slot />
				</main>
			</div>
		</UApp>
    </section>
</template>
<script setup lang="ts">
    import { useAppConfig, useI18n, useHead, computed } from '#imports'

    useHead({
        htmlAttrs: {
            class: 'h-full'
        },
        bodyAttrs: {
            class: 'h-full'
        }
    })

    const { t } = useI18n()


    const appConfig = useAppConfig()

    const items = computed(() => appConfig.navigation.main.items.map(
        (item)=>({
          label: item?.t ? t(item.t) : item.label || '',
          icon: item?.icon || '',
		  to: item?.to || '',
		  defaultOpen: item?.defaultOpen || false,
		  children: item?.children || []
        })
      )
    )
</script>