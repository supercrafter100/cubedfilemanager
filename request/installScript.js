const fetch = require('node-fetch');
const { Spinner } = require('clui');
const create = require('../methods/create');
const chalk = require('chalk');

module.exports = async (cookie) => {
	return new Promise(async (resolve) => {
		const headers = require('../index').getHeaders();
		const spin = new Spinner('Checking for broadcasting script. Please wait')
		spin.start()
		const url = 'https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts/cubedFileManager.sk&dir=/plugins/Skript/scripts'
		fetch(url, { headers })
		.then((res) => res.text())
			.then(async (html) => {
				spin.stop()
				if (html === '<script data-cfasync="false">window.location.replace("/dashboard/filemanager");</script>') {
					console.log(chalk.red('Did not find broadcast script. Creating it for you...'))
					
					await fetch('https://raw.githubusercontent.com/supercrafter100/cubedfilemanager/master/lib/script.txt').then(res => res.text())
						.then(async content => {
	
							await create('cubedFileManager.sk', content);

							resolve();
					})
	
					
				} else {
					resolve();
				}
			})
	})
}