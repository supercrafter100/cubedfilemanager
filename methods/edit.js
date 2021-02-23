const { Spinner } = require('clui');
const { default: fetch } = require('node-fetch');
const { URLSearchParams } = require('url');

const log = require('./log');
const sendCommand = require('./sendCommand');
const getConsole = require('../methods/getConsole');

const cheerio = require('cheerio');
const chalk = require('chalk');

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
				
				const log_errors = require('../index').getErrorLog();
				if (log_errors == true) {
					
					// Get the latest console data
					let console_data = await getConsole();
					console_data = console_data.replace(/<br \/>/g, "").replace(/&quot;/g,'"')
					const lines = console_data.split('\n');

					let reading_error = false;
					let current_data = "";

					const skript_reloads = [];

	
					for (let i = 0; i < lines.length; i++) {
						const current_line = lines[i]
						if (current_line.includes(`[Skript] Reloading ${name}...`) && !reading_error) {
							reading_error = true;
							current_data = "";
						} else if (current_line.includes(`[Skript] Encountered`) && reading_error) {
							reading_error = false;
							// parsing the error count :P
							const split_error_line = current_line.split(' ');
							const error_count = split_error_line[5];
							skript_reloads.push({
								data: current_data,
								errors: parseInt(error_count)
							});
						} else if (current_line.includes(`Successfully reloaded ${name}.`) && reading_error) {
							reading_error = false;
							skript_reloads.push({
								data: current_data,
								errors: 0
							});
						} else if (reading_error) {
							current_data += `\n${current_line}`;
						}
					}

					// Getting the last error
					const last_error = skript_reloads[skript_reloads.length - 1];
					if (last_error) {
						if (last_error.errors > 0) {
							console.log(chalk.bgRedBright('Encountered an error when reloading ' + name))
							console.log(last_error['data'].replace('\n', ""));
							console.log(chalk.redBright(`Script reloaded with ${last_error.errors} errors`))
						}
					}


				}
				resolve()
			});
		})
	})
};


function getFileExtension(fname) {
	return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
}