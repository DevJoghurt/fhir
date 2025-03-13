import type { FhirProfilePackageMeta } from './types'
import {
	addTemplate,
  } from '@nuxt/kit'

export const createPackageProfileTemplate = (
		profilePackageMeta: FhirProfilePackageMeta[],
	) => {
	let profilingPackagesContent = 'import { useStorage } from "#imports";\n'
	// create a file that exports all profiling packages
	for(const packageMeta of profilePackageMeta){
		profilingPackagesContent += `const meta_${packageMeta.normalizedName} = ${JSON.stringify(packageMeta)};\n`
	}
	profilingPackagesContent += `const packages = [];\n`
	for(const packageMeta of profilePackageMeta){
		profilingPackagesContent += `packages.push({meta: meta_${packageMeta.normalizedName}, package: "${packageMeta.name}"});\n`
	}
	profilingPackagesContent += `export type ProfilePackage = ${profilePackageMeta.map((meta) => "'" + meta.name + "'").join(' | ')};\n`
	// Function to load a profile package meta
	profilingPackagesContent += `export const loadFhirProfileMeta = (name: ProfilePackage) => packages.find(p => p.package === name)?.meta;\n`
	// Function to load a json profile by package and nomralized name
	profilingPackagesContent += `export const loadFhirProfileData = (name: ProfilePackage, normalizedName: string) => {
		const packageMeta = loadFhirProfileMeta(name);
		if(packageMeta){
			const profile = packageMeta.files.find(f => f.normalizedName === normalizedName);
			if(profile){
				return useStorage(name).getItem(profile.path);
			}
		}
		return null;
	};\n`

	addTemplate({
		filename: 'profiling-packages.ts',
		write: true,
		getContents: () => profilingPackagesContent,
	})
}