const path = require('path');
const fs = require('fs');

const emitter = require('events');

const fetch = require('node-fetch');
const cheerio = require('cheerio');

class fileDownloader extends emitter {

	constructor() {
		super()
		this.loaded = false;
	}

	async load(config = { loadDir: null, saveDir: null, headers: null }) {
		if (this.loaded) throw new Error("File synchronising is already in progress");
		this.loaded = true;

		if (config.loadDir == null) throw new TypeError("No start path provided");
		if (config.saveDir == null) throw new TypeError("No save directory provided")
		if (config.headers == null) throw new TypeError("No headers provided")
		
		this.saveDir = config.saveDir;
		
		this.downloadFiles(config.loadDir, config.headers);
		this.emit('load');
	}

	async downloadFiles(dir, headers) {
		// Get the files

		const url = `https://playerservers.com/queries/list_files/?dir=/plugins/Skript/scripts${dir}`;
		const json = await fetch(url, { headers }).then((res) => res.json());

		for (const file of json.files) {
			const contents = await getFileContents(dir, file.filename, headers);
			const p = path.join(this.saveDir, '.', dir);

			await fs.promises.mkdir(p, { recursive: true });
			fs.writeFileSync(path.join(p, file.filename), contents);
		}

		for (const folder of json.folders) {
			await this.downloadFiles(`${dir}/${folder.foldername}/`, headers);
		}
	}
}
module.exports = fileDownloader;

function getFileContents(path, file, headers) {
	return new Promise(async (resolve) => {
		const url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts${path}${file}&dir=/plugins/Skript/scripts${path}`;
		const html = await fetch(url, { headers }).then((res) => res.text());

		const $ = cheerio.load(html);
		const contents = $('#code').text();
		resolve(contents);
	})
}
