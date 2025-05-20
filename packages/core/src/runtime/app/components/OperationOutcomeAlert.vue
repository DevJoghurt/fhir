<template>
	<UAlert
		v-if="error"
		icon="i-heroicons-command-line"
		:close="{
			icon: 'i-heroicons-x-mark-20-solid',
			color: 'primary',
			variant: 'link',
			padded: false,
			onClick: () => error = false
		}"
		variant="subtle"
		title="Error"
		color="error">
			<template #description>
				<ul>
					<li v-for="issue in issues" :key="issue.details?.text">
						{{ operationOutcomeIssueToString(issue) }}
					</li>
				</ul>
			</template>
	</UAlert>
</template>
<script setup lang="ts">
	import type { OperationOutcome, OperationOutcomeIssue } from '@medplum/fhirtypes';
	import { computed, ref, watch, operationOutcomeIssueToString } from "#imports"
	import type { Ref } from "#imports"

    type OOAProps = {
        outcome?: OperationOutcome;
		issues?: OperationOutcomeIssue[];
    }

    const props = defineProps<OOAProps>();

	const error = ref(false);

	const issues = computed(() => {
		return props.outcome?.issue || props.issues;
	}) as Ref<OperationOutcomeIssue[]>;

	watch(issues, () => {
		setError(issues.value);
	});

	const setError = ((val) => {
		error.value = (!val || val.length === 0) ? false : true;
	})

	setError(issues.value);
</script>