<template>
    <UApp>
        <NuxtLoadingIndicator />
        <slot />
    </UApp>
</template>
<script setup lang="ts">
    import { useHead } from '#imports'

    useHead({
        htmlAttrs: {
            class: 'h-full bg-gray-50'
        },
        bodyAttrs: {
            class: 'h-full'
        }
    })
</script>