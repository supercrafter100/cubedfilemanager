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

		const files = [];
		const folders = [];

		const url = `https://playerservers.com/dashboard/filemanager/&dir=/plugins/Skript/scripts${dir}`;
		const html = await fetch(url, { headers }).then((res) => res.text());

		const $ = cheerio.load(html);
		$('body > div > div > section > div > div > div > div > table > tbody > tr').each(async (index, element) => {
			const text = $(element).children('td:nth-child(1)').text();
			const split = text.split(' ');
	
			const i = $(element).children('td:nth-child(1)').children('a').children('i');
			const isFolder = i.hasClass('fa-folder');
			// console.log(isFolder)
			
			const fileName = split.slice(0, split.length - 3).join(' ').trim();
			if (fileName.length > 0) {
				if (isFolder) {
					folders.push(fileName);
				} else {
					if (!fileName.startsWith('-')) {
						files.push(fileName)
					}
				}
			}
		});

		for (const file of files) {
			const contents = await getFileContents(dir, file, headers);
			const p = path.join(this.saveDir, '.', dir);

			await fs.promises.mkdir(p, { recursive: true });
			fs.writeFileSync(path.join(p, file), contents);
		}

		for (const dir2 of folders) {
			await this.downloadFiles(`${dir}${dir2}/`, headers);
		}
	}
}
module.exports = fileDownloader;

function getFileContents(path, file, headers) {
	return new Promise(async (resolve) => {
		const url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts${path}${file}&dir=/plugins/Skript/scripts${path}`;
		const html = await fetch(url, { headers }).then((res) => res.text());

		const $ = cheerio.load(html);
		const contents = $('#edit-file-content').text();
		resolve(contents);
	})
}
