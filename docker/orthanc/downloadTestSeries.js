import { writeFile } from 'node:fs/promises';

const apiUrl = 'https://services.cancerimagingarchive.net/nbia-api/services/v1/getImage?SeriesInstanceUID='

const series = [
	'1.3.6.1.4.1.9328.50.2.160465',
	'1.3.6.1.4.1.9328.50.2.160111',
	'1.3.6.1.4.1.9328.50.2.160730'
]

function downloadFile(url, outputPath) {
	return fetch(url)
		.then(x => x.arrayBuffer())
		.then(x => writeFile(outputPath, Buffer.from(x)));
}

for (const serie of series) {
	downloadFile(apiUrl+serie, './tmp/' + serie + '.zip')
}
