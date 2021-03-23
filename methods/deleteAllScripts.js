const cheerio = require('cheerio');
const fetch = require('node-fetch');
const chalk = require('chalk');

const remove = require('./remove');
const removeDir = require('./deleteDir');
const isOnline = require('../request/isOnline');
module.exports = async () => {


	if (await isOnline() == false) {
		console.log(chalk.redBright('The server has to be online for this to work properly!'))
		process.exit();
	}

	const headers = require('../index').getHeaders();

	// Request the html of the page, so we can get all the scripts on the server
	const url = 'https://playerservers.com/dashboard/filemanager/&dir=/plugins/Skript/scripts';
	const html = await fetch(url, { headers }).then((res) => res.text());

	const $ = cheerio.load(html);

	const files = [];
	const folders = [];

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
				if (fileName.startsWith('-')) {
					files.push(fileName.slice(1))
				} else {
					files.push(fileName)
				}
			}
		}
	});

	for (const file of files) {
		await remove(file);
	}

	for (const folder of folders) {
		await removeDir(folder);
	}
}