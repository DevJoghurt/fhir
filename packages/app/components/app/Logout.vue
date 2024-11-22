<template>
    <span
        @click.prevent="onLogout">
        {{ props.label ? props.label : t('auth.signOutButton') }}
    </span>
</template>
<script setup lang="ts">
    import { useI18n, useUserSession, useRouter } from '#imports'

    type Button = {
        label?: string
    }

    interface Props extends Button {

    }

	const router = useRouter()

    const { t } = useI18n({
        useScope: 'global'
    })

    const props = withDefaults(defineProps<Props>(), {
    })

    const { clear } = useUserSession()

    const onLogout = async () => {
        await clear()
		router.push('/login')
    }
</script>