const FHIR_PACKAGES_ENDPOINT = 'https://packages.fhir.org';


function downloadFile(url: string): Promise<ArrayBuffer> {
	return fetch(url)
		.then(x => x.arrayBuffer());
}

export class PackageLoader {
	private readonly name: string;
	private readonly version: string;
	private binary: Buffer | null = null;

	constructor(name: string, version: string) {
		this.name = name;
		this.version = version;
	}

	async load() {
		const file = await downloadFile(`${FHIR_PACKAGES_ENDPOINT}/${this.name}/${this.version}`);
		this.binary = Buffer.from(file)
	}
}