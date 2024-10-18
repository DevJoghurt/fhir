<template>
	<USlideover
		title="Slideover with close button"
		:close="{
		color: 'primary',
		variant: 'outline',
		class: 'rounded-full'
		}"
	>
		<UButton
		  variant="ghost"
		  size="icon"
		  class="md:hidden"
		>
		  <UIcon name="lucide:menu" size="18" />
		</UButton>
		<template #body>
			<LayoutHeaderLogo />
			<LayoutAside is-mobile />
		</template>
	</USlideover>
</template>