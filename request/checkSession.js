const { Spinner } = require("clui");
const { default: fetch } = require('node-fetch');
const chalk = require('chalk');


// If the token exists we can just like assign it
// Checking if the token is correct
module.exports = async () => {
	return new Promise(async (resolve) => {
		const status = new Spinner('Checking your session token. Please wait')
		status.start();

		const headers = require('../index').getHeaders();
		
		
		/**
		 * Fetching
		 */
		
		
		// Fetching token via login
		const url = 'https://playerservers.com/dashboard'
		fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {
			status.stop();
			if (html) {
				if (html.includes("/login/")) {
					console.log(chalk.red('Invalid session token'));
					process.exit();
				}
			}
		
			console.log(chalk.green('Valid session token'));
			resolve();
		});
	})
} 