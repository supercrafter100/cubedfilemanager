const cheerio = require('cheerio');
const fetch = require('node-fetch');
const chalk = require('chalk');

const remove = require('../remove');
const removeDir = require('../deleteDir');
const isOnline = require('../../request/isOnline');
module.exports = async () => {


	if (await isOnline() == false) {
		console.log(chalk.redBright('The server has to be online for this to work properly!'))
		process.exit();
	}

	const headers = require('../../index').getHeaders();

	// Request the html of the page, so we can get all the scripts on the server
	const url = 'https://playerservers.com/queries/list_files/?dir=/plugins/Skript/scripts';
	const json = await fetch(url, { headers }).then((res) => res.json());

	const $ = cheerio.load(html);

	for (const file of json.files) {
		await remove(file.filename);
	}

	for (const folder of json.folders) {
		await removeDir(folder.foldername);
	}
}