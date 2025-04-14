import { globby } from 'globby'
import { opendir } from 'node:fs/promises'
import { join } from 'pathe'
import type { Package } from './types'
import { defu } from 'defu'
import type { NuxtOptions } from '@nuxt/schema'


async function getDirectories(dir: string): Promise<string[]> {
	const dirs = [];
    for await (const d of await opendir(dir)) {
        if (d.isDirectory()) dirs.push(d.name);
    }
	return dirs
}

export async function importLocalProfilingDirs(profilingPaths: string[], nuxtOptions: NuxtOptions) : Promise<void> {
	if(nuxtOptions.nitro.serverAssets === undefined){
		nuxtOptions.nitro.serverAssets = []
	}
	const packages = [] as Package[]
	// Profile packages are defined in the serverDir/profiling/{profile name} directory
	// Each profile package is defined in a file named package.ts or package.json
	for (const profilingPath of profilingPaths) {
		const dirs = await getDirectories(profilingPath)
		for (const dir of dirs) {
			const cPackage = {} as Package
			// get all files if dir has profiling files
			const profilingFiles = await globby(`${join(profilingPath, dir)}/**/*.json`, {
				deep: 2,
			})
			if(profilingFiles.length > 0){
				cPackage.identifier = dir
				cPackage.mounted = {
					baseName: `assets:${dir}`,
					dir: join(profilingPath, dir),
					paths: profilingFiles.map(file => file.replace(`${profilingPath}/${dir}/`, ''))
				}
				// add the package to the assets storage
				nuxtOptions.nitro.serverAssets.push({
					baseName: dir,
					dir: join(profilingPath, dir)
				})
				packages.push(cPackage)
				continue
			}
			// It is also allowed to have a .tgz or .tar file in the directory with all the profiling files
			else {
				// find all tar files in the directory
				const profilingPackagedFiles = await globby(`${join(profilingPath, dir)}/**/*.{tar,tgz}`)
				if((profilingPackagedFiles.length > 0) && (profilingPackagedFiles.length === 1)){
					cPackage.identifier = dir
					cPackage.compressed = {
						baseName: `assets:${dir}`,
						file: profilingPackagedFiles[0].replace(`${profilingPath}/${dir}/`, '')
					}
					cPackage.mounted = false
					nuxtOptions.nitro.serverAssets.push({
						baseName: dir,
						dir: join(profilingPath, dir)
					})
					packages.push(cPackage)
				}
			}
		}
	}

	nuxtOptions.runtimeConfig.profiling = defu(nuxtOptions.runtimeConfig.profiling || {}, {
		packages
	})
}