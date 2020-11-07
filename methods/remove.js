const { Spinner } = require("clui");
const log = require("./log");
const sendCommand = require("./sendCommand");
const fetch = require('node-fetch');

module.exports = async (name, rawPath = "") => {
	return new Promise(async (resolve) => {

		const headers = require('../index').getHeaders();
		const cli = require('../index').flags;

		const spin = new Spinner(`Deleting file ${name}...`);

		if (cli.flags.folderSupport && rawPath.length > 0) {
			let normalpath = rawPath.split('\\')
			path = normalpath.slice(0, normalpath.length - 1).join('/');
		} else {
			path = rawPath;
		}

		spin.start();

		await sendCommand(`sk disable ${cli.flags.folderSupport ? `${path}/${name}` : name}`)
		sleep(100);
		let url = `https://playerservers.com/dashboard/filemanager/&action=delete&delete=/plugins/Skript/scripts/${path}/-${name}&dir=/plugins/skript/scripts/${path}`;
		
		await fetch(url, { headers })
		.then(async () => {
			spin.stop();
			log(`Deleted file ${name}`);
			await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fDeleted file &b${cli.flags.folderSupport ? `${path}/${name}` : name}`);
			resolve();
		})

	})
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
 }