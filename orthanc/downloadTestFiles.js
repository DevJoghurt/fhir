import { writeFile } from 'node:fs/promises';

function downloadFile(url, outputPath) {
	return fetch(url)
		.then(x => x.arrayBuffer())
		.then(x => writeFile(outputPath, Buffer.from(x)));
}

downloadFile('https://services.cancerimagingarchive.net/nbia-api/services/v1/getImage?SeriesInstanceUID=1.3.6.1.4.1.9328.50.2.160465', './tmp/study.zip')
