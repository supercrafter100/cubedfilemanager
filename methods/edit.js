const { Spinner } = require('clui');
const { default: fetch } = require('node-fetch');
const { URLSearchParams } = require('url');

const log = require('./log');
const sendCommand = require('./sendCommand');
const cheerio = require('cheerio');

module.exports = async (name, content, rawPath = "") => {
	return new Promise(async (resolve) => {
		/**
		 * Grabbing basic data
		 */
		
		const headers = require('../index').getHeaders();
		const cli = require('../index').flags;

		const spin = new Spinner(`Editing file ${name}...`)
		let path;

		if (cli.flags.folderSupport && rawPath.length > 0) {
			let normalpath = rawPath.split('\\')
			path = normalpath.slice(0, normalpath.length - 1).join('/');
			path  = path + "/"
		} else {
			path = rawPath;
		}
	
		/**
		 * Editing
		 */
	
		let url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts/${path}${name}&dir=/plugins/Skript/scripts/${path}`;
		spin.start();
		
		await fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {
	
			/**
			 * First fetch for getting edit token
			 */
	
			const fileExtension = getFileExtension(name);
			const fileName = name.replace(("." + fileExtension))
	
			const $ = cheerio.load(html);
			const editToken = $("input[name=token]").val();
	
			const params = new URLSearchParams();
			params.append("token", editToken);
			params.append("edit-file-name", fileName);
			params.append("edit-file-content", content);
			params.append("edit-file-sub", "Save");
	
			await fetch(url, {
				method: "POST",
				headers,
				body: params,
			}).then(async () => {
				spin.stop();
				log(`Saved file ${name}`);
				await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fSaved file &b${cli.flags.folderSupport ? `${path}${name}` : name}`);
				await sendCommand(`sk reload ${cli.flags.folderSupport ? `${path}${name}` : name}`)
				await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fReloaded file &b${cli.flags.folderSupport ? `${path}${name}` : name}`);
				resolve()
			});
		})
	})
};


function getFileExtension(fname) {
	return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
}