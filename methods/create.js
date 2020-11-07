const CLI = require('clui');
const Spinner = CLI.Spinner;
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URLSearchParams } = require("url");

const log = require('./log');
const sendCommand = require('./sendCommand');

module.exports = async (name, content = "", rawPath = "") => {
	return new Promise(async (resolve) => {
		/**
		 * Grabbing basic data
		 */
		const headers = require('../index').getHeaders();
		const cli = require('../index').flags;

		let path;
		const spin = new Spinner(`Creating file ${name}...`);

		if (cli.flags.folderSupport && rawPath.length > 0) {
			let normalpath = rawPath.split('\\')
			path = normalpath.slice(0, normalpath.length - 1).join('/');
		} else {
			path = rawPath;
		}

		/**
		 * Creation
		 */
	
		let url = `https://playerservers.com/dashboard/filemanager/?action=new&dir=/plugins/Skript/scripts/${path}`;
		
		spin.start();
		await fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {	

	
			/**
			 * First fetch is to get the edit token
			 */
	
			const fileExtension = getFileExtension(name);
			const replacement = "." + fileExtension;
			const fileName = name.replace(replacement, "");
	
			const $ = cheerio.load(html);
			const editToken = $("input[name=token]").val();
	
			const params = new URLSearchParams();
			params.append("token", editToken);
			params.append("edit-file-name", fileName);
			params.append("edit-file-content", content);
			params.append("edit-file-sub", "Save");
			params.append("ext", fileExtension);
	
			/**
			 * Fetching a second time to actually make the file
			 */
			
			await fetch(url, {
				method: "POST",
				headers,
				body: params
			}).then(async () => {
				spin.stop();
				log(`Created file ${fileName}.${fileExtension}`)

				await sendCommand(`sk reload ${cli.flags.folderSupport ? `${path}/${name}` : name}`)
				await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fCreated${content.length ? " and enabled" : ""} &b${cli.flags.folderSupport ? `${path}/${name}` : name}`);
				
				resolve();
			})	
		})
	})
}

function getFileExtension(fname) {
	return fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
}