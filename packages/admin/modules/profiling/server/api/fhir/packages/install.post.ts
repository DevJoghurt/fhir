import {
	defineEventHandler,
	usePackageInstaller,
	usePackageStore,
	readValidatedBody,
	setResponseStatus } from '#imports';
import { z } from 'zod';

const bodySchema = z.object({
	package: z.string(),
	version: z.string(),
  })


export default defineEventHandler(async (event) => {

	const validatedResult = await readValidatedBody(event, bodySchema.safeParse)
	if (!validatedResult.success) {
		setResponseStatus(event, 400)
		return {
			status: 400,
			error: validatedResult.error.flatten(),
		}
	}

	// add the package to the installation queue
	const { addDownloadPackage } = usePackageStore()

	const pkg = await addDownloadPackage(validatedResult.data.package, validatedResult.data.version)
	if (!pkg) {
		setResponseStatus(event, 500)
		return {
			status: 500,
			error: 'Add package to download queue failed',
		}
	}

	// add the package to the installation queue
	const { install } = usePackageInstaller()
	// start installation process in the background
	await install()

	return {
		status: 200,
		message: 'Package loaded',
		data: pkg,
	} as any
})