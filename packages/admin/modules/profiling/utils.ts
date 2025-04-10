import { globby } from 'globby'
import { opendir } from 'node:fs/promises'
import { join } from 'pathe'
import type { FhirProfilePackageMeta , FhirPofilePackage, ProfileType } from './types'
import { loadFile } from 'magicast'

async function getDirectories(dir: string): Promise<string[]> {
	const dirs = [];
    for await (const d of await opendir(dir)) {
        if (d.isDirectory()) dirs.push(d.name);
    }
	return dirs
}

/**
 *
 * This function returns the profile type based on the resourceType of the content.
 * nhealth uses a specific data structure to build a IG and load data into the FHIR server.
 * These are the types of profiles that are supported:
 * - codeSystem
 * - valueSet
 * - searchParameter
 * - extension
 * - profile
 * - example
 *
 * @param content
 * @returns ProfileType | null
 */
function getProfileType(content: any) : ProfileType | null {
	if(content?.resourceType === 'CodeSystem'){
		return 'codeSystem'
	}
	if(content?.resourceType === 'ValueSet'){
		return 'valueSet'
	}
	if(content?.resourceType === 'SearchParameter'){
		return 'searchParameter'
	}
	if(content?.resourceType === 'StructureDefinition'){
		if(content?.type === 'Extension'){
			return 'extension'
		}
		return 'profile'
	}
	// currently filter out CapabilityStatement and OperationDefinition
	if(['CapabilityStatement', 'OperationDefinition'].indexOf(content?.resourceType) !== -1){
		return null
	}
	if(content?.resourceType){
		return 'example'
	}
	return null
}

type FhirProfileAsset = {
	name: string
	resolvedPath: string
}

export type FhirProfilePackageMetaResult = {
	meta: FhirProfilePackageMeta[]
	assets: FhirProfileAsset[]
}

export async function analyzePackageDirs(profilingPaths: string[]) : Promise<FhirProfilePackageMetaResult> {
	const profilePackagesMeta = [] as FhirProfilePackageMeta[]
	const assets = [] as FhirProfileAsset[]
	// Profile packages are defined in the serverDir/profiling/{profile name} directory
	// Each profile package is defined in a file named package.ts or package.json
	for (const profilingPath of profilingPaths) {
		const dirs = await getDirectories(profilingPath)
		for (const dir of dirs) {
			assets.push({
				name: dir,
				resolvedPath: join(profilingPath, dir)
			})
			const profilePackage = {
				type: 'dir'
			} as FhirProfilePackageMeta
			const profilingFiles = await globby(`${join(profilingPath, dir)}/**/*.{json,ts,js}`, {
				deep: 2,
			})
			// find package meta file
			const packageMeta = profilingFiles.find(file => file.endsWith('package.ts') || file.endsWith('package.json'))
			if (packageMeta === undefined) {
				console.warn(`No package meta file found in ${dir}`)
				continue
			}
			let packageMetaDefaults = {} as FhirPofilePackage
			if (packageMeta.endsWith('package.ts')) {
				const mod = await loadFile(packageMeta)
				const options =
					mod.exports.default.$type === "function-call"
						? mod.exports.default.$args[0]
						: mod.exports.default;
				if(options){
					packageMetaDefaults = options
				}
			}
			if (packageMeta.endsWith('package.json')) {
				packageMetaDefaults = await require(packageMeta)
			}
			profilePackage.name = packageMetaDefaults.name || 'none'
			// create a normalized name for the package by removing .,#,/,-
			profilePackage.normalizedName = 'package_' + packageMetaDefaults.name.replaceAll(/[\.\,#\/-]/g, '_')
			profilePackage.version = packageMetaDefaults.version || 'none'
			// There seems to be a bug in magicast that doesn't allow for array defaults
			profilePackage.fhirVersions = Array.isArray(packageMetaDefaults?.fhirVersions) ? packageMetaDefaults.fhirVersions : ['4.0.1']
			profilePackage.author = packageMetaDefaults.author || 'none'
			profilePackage.description = packageMetaDefaults.description || 'none'
			profilePackage.dependencies = packageMetaDefaults.dependencies || {}
			profilePackage.files = []
			// filter all profiling files that are json and not package.json
			const profilingFilesFiltered = profilingFiles.filter(file => file.endsWith('.json') && !file.endsWith('package.json') && !file.endsWith('.index.json'))
			let fileNameMap = {} as Record<string, number>
			for (const file of profilingFilesFiltered) {
				const packageFile = await require(file)
				const type = getProfileType(packageFile)
				if(type){
					const fileNormalizedName = packageFile?.id.replaceAll(/[\.\,#\/-]/g, '_')
					if(fileNameMap[fileNormalizedName] === undefined){
						fileNameMap[fileNormalizedName] = 0
					}else{
						fileNameMap[fileNormalizedName] += 1
					}
					// File path needs to be relative to the profiling directory
					const relativePath = file.replace(join(profilingPath, dir, '/'), '')
					profilePackage.files.push({
						type,
						normalizedName: `f_${fileNormalizedName}${fileNameMap[fileNormalizedName] > 0 ? `_${fileNameMap[fileNormalizedName]}` : ''}`,
						resource: packageFile?.resource || 'none',
						snapshot: packageFile?.snapshot? true : false,
						path: relativePath,
					})
				}
			}

			profilePackagesMeta.push(profilePackage)
		}

		// support tar files
		const profilingPackagedFiles = await globby(`${profilingPath}/**/*.{tar,tgz}`, {
			deep: 2,
		})

		for (const file of profilingPackagedFiles) {
			const profilePackage = {
				type: 'tar',
				version: 'none'
			} as FhirProfilePackageMeta
			// get file name without path and extension
			// e.g. package.tar -> package
			const fileName = file.split('/').pop() || ''
			const packageName = fileName.split('.').slice(0, -1).join('.')

			profilePackage.name = packageName
			profilePackage.normalizedName = 'package_' + packageName.replaceAll(/[\.\,#\/-]/g, '_')
			profilePackage.files = []
			// add tar file to assets
			assets.push({
				name: packageName,
				resolvedPath: file
			})
			profilePackagesMeta.push(profilePackage)
		}
	}
	return {
		meta: profilePackagesMeta,
		assets
	}
}