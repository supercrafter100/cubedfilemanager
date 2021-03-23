const path = require('path');
const fs = require('fs');

const emitter = require('events');
const uploadFile = require('./create');

class fileUploader extends emitter {

	constructor() {
		super()
		this.loaded = false;
	}

	async load(config = { loadDir: null }) {
		if (this.loaded) throw new Error("File uploading is already in progress");
		this.loaded = true;

		if (config.loadDir == null) throw new TypeError("Upload directory is null");
		
		this.uploadFiles(config.loadDir);
		this.emit('load');
	}

	async uploadFiles(dir) {
		const files = fs.readdirSync(dir);

		for (let i = 0; i < files.length; i++) {
			const file = path.join(dir, files[i]);

			if (fs.lstatSync(file).isDirectory()) {
				await this.uploadFiles(file);
			}
			else if (!files[i].endsWith('.sk')) {
				i == i
			}
			else {
				const contents = fs.readFileSync(file);

				await uploadFile(files[i], contents);
				this.emit('upload', files[i]);
			}
		}
	}
}
module.exports = fileUploader;

function getFileExtension(fname) {
	return fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
}