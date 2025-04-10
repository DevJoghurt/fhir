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
	profilingPackagesContent += `export type ProfilePackage = ${profilePackageMeta.map((meta) => "'" + meta.name + "'").join(' | ') || null};\n`
	// Function to get a profile package meta
	profilingPackagesContent += `export const getFhirProfileMeta = (name: ProfilePackage) => packages.find(p => p.package === name)?.meta;\n`
	// Function to get a json profile by package and normalized name
	profilingPackagesContent += `export const getFhirProfileData = (name: ProfilePackage, normalizedName: string) => {
		const packageMeta = getFhirProfileMeta(name);
		if(packageMeta){
			const profile = packageMeta.files.find(f => f.normalizedName === normalizedName);
			if(profile){
				return useStorage(name).getItem(profile.path);
			}
		}
		return null;
	};\n`

	profilingPackagesContent += `export const getFhirPackages = () => {
		return packages.map(p => {
			return {
				name: p.package,
				meta: p.meta
			}
		})
	}\n`

	addTemplate({
		filename: 'profiling-packages.ts',
		write: true,
		getContents: () => profilingPackagesContent,
	})
}