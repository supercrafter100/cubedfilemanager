const { Spinner } = require('clui');
const { default: fetch } = require('node-fetch');
const log = require('./log');

module.exports = (rawPath) => {
	return new Promise(async (resolve) => {

		const headers = require('../index').getHeaders();
		const cli = require('../index').flags;
		
		if (cli.flags.folderSupport) {

			let normalpath = rawPath.split('\\')
			let dir = normalpath[normalpath.length - 1]
			let ppath = await normalpath.slice(0, normalpath.length - 1).join('/');
			
			let path = await rawPath.split('\\').join('/');
			const spin = new Spinner('Deleting folder ' + dir);
			
			const url = `https://playerservers.com/dashboard/filemanager/&action=delete&delete=/plugins/Skript/scripts/${path}&dir=/plugins/Skript/scripts/${ppath}`;
			spin.start()
			await fetch(url, { headers })
			.then(() => {
				spin.stop();
				log(`Deleted folder ${dir}`);
				resolve();
			})
		} else {
			const spin = new Spinner('Deleting folder ' + rawPath);

			const url = `https://playerservers.com/dashboard/filemanager/&action=delete&delete=/plugins/Skript/scripts/${rawPath}&dir=/plugins/Skript/scripts`;
			spin.start();
			await fetch(url, { headers })
			.then(() => {
				spin.stop();
				log(`Deleted folder ${rawPath}`);
				resolve();
			})
		}
	})
}
