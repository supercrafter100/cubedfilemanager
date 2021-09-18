/**
 * Dependencies
 */
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URLSearchParams } = require("url");
const CLI = require('clui');
const Spinner = CLI.Spinner;

const log = require('./log');
/**
 * Checks the scripts directory to see if the folders exist.
 * @param {*} path The path to check
 */
module.exports = async (path = "\\") => {
	return new Promise(async (resolve) => {
		let dirs = path.split('\\');
		dirs = dirs.slice(0, (dirs.length - 1));
		let currentPath;

			for (const dir of dirs) {

				if (currentPath) {
					previousPath = currentPath;
					currentPath += `/${dir}`;
				} else {
					previousPath = '/';
					currentPath = `/${dir}`;
				}

				/**
				 * Check if the directory exists
				 */
				let status = await checkDirectory(currentPath);
				if (status == false) {
					await createDirectory(previousPath, dir);
				};
			}

		resolve();
	})
}

async function checkDirectory(dir) {
	return new Promise(async (resolve) => {
		const headers = require('../index').getHeaders();
		
		const url = `https://playerservers.com/queries/list_files/?dir=/plugins/Skript/scripts${dir}`;
		await fetch(url, { headers })
		.then((res) => res.json())
		.then(async (json) => {
			if (json.error) {
				resolve(false);
			}
			resolve(true);
		})
	})
}

async function createDirectory(dir, dirName) {
	return new Promise(async (resolve) => {
		const headers = require('../index').getHeaders();
		const spin = new Spinner('Creating new folder');
		
		/**
		 * First fetch is to get the token
		 */
		spin.start();
		const url = `https://playerservers.com/dashboard/filemanager/?action=new_folder&dir=/plugins/Skript/scripts${dir}`;
			
		await fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {
		
			const $ = cheerio.load(html);
			const editToken = $("input[name=token]").val();
		
			const params = new URLSearchParams();
			params.append("new-folder-name", dirName);
			params.append("token", editToken);
			params.append("edit-file-sub", "Save");
		
			/**
			 * Fetching a second time to create the actual directory
			 */
		
			await fetch(url, {
				method: "POST",
				headers,
				body: params
			}).then((e) => {
				spin.stop();
				log(`Created folder ${dirName}`);
				resolve("a");
			})
		})
	}) 
}