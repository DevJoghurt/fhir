import {
	defineNuxtModule,
	createResolver,
	addImports,
	hasNuxtModule,
	installModule,
	addComponentsDir
  } from '@nuxt/kit'
import defu from 'defu'
// ts bug: https://github.com/nuxt/module-builder/issues/141
import type {} from 'nuxt/schema'

type DicomWeb = {
	serverUrl: string;
	prefix?: string;
}

export type ModuleOptions = {
	web?: DicomWeb;
}

declare module '@nuxt/schema' {
	interface PublicRuntimeConfig {
		dicom: {
			web?: DicomWeb;
		}
	}
}

const meta = {
	name: '@nhealth/dicom',
	version: '0.1',
	configKey: 'dicom',
};

export default defineNuxtModule<ModuleOptions>({
	meta,
	defaults: {
		web: {
			serverUrl: 'http://localhost:8042',
			prefix: 'dicom-web'
		}
	},
	async setup(options, nuxt) {
		const { resolve } = createResolver(import.meta.url);

		addImports([{
			name: 'useDicomWeb',
			as: 'useDicomWeb',
			from: resolve('./runtime/app/composables/useDicomWeb')
		}]);


		const runtimeConfig = nuxt.options.runtimeConfig || {};

		runtimeConfig.public.dicom.web = defu(runtimeConfig.public?.dicom?.web || {}, options.web);
	},
})