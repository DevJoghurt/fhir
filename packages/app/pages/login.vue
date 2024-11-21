<template>
    <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
            <!--Logo class="h-16" /-->
        </div>
        <h2 class="mt-8 text-center text-2xl font-medium leading-9 tracking-tight text-gray-700 dark:text-gray-200">{{ t('auth.pageLoginTitle') }}</h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
		<UCard>
            <UForm
                class="space-y-6"
				:state="state"
				:validateOn="['blur', 'input', 'change']"
				@submit="onSubmit"
                :schema="schema">
                <FhirOperationOutcomeAlert :outcome="errorOutcome" />
                <UFormField name="email" :label="t('auth.email')">
                    <UInput v-model="state.email" icon="i-heroicons-at-symbol" class="w-full"size="md" type="email" :placeholder="t('auth.email')"></UInput>
                </UFormField>

                <UFormField name="password" :label="t('auth.password')">
                    <UInput v-model="state.password" icon="i-heroicons-key" class="w-full" size="md" type="password" :placeholder="t('auth.password')"></UInput>
                </UFormField>
				<div>
                    <UButton type="submit" :loading="loading" :label="t('auth.signInButton')" block />
                </div>

                <div>
                    <AuthMedplum type="submit" :loading="loading" :label="t('auth.signInButton')" block />
                </div>
			</UForm>
		</UCard>
	  </div>
	</div>
</template>
<script setup lang="ts">
	import z from 'zod'
	import type { FormSubmitEvent } from '#ui/types'
	import { useI18n, useMedplum } from '#imports'
    import type { Ref } from '#imports'
    import type { OperationOutcome } from '#fhir'

    const { t } = useI18n({
        useScope: 'global'
    })

	const { loading, medplum, login } = useMedplum()

	const state = reactive({
        email: undefined,
        password: undefined
    })

    const schema = z.object({
        email: z.string({
            required_error: t('auth.errorEmailEmpty')
        }).email({ message: t('auth.errorEmailInvalid') }),
        password: z.string({
            required_error: t('auth.errorPasswordEmpty')
        })
    })

    watch(() => loading, (value) => {
        console.log('loading', value)
    })

    const errorOutcome = ref(undefined) as Ref<OperationOutcome | undefined>;

    type AuthSchema = z.output<typeof schema>;

	async function onSubmit (payload: FormSubmitEvent<AuthSchema>) : Promise<void> {
        const { email, password } = payload.data;
        const { credentials, error } = await login(email, password);
        if (error) {
            errorOutcome.value = error;
            return;
        }
    }
</script>