const readline = require('readline');
const chalk = require('chalk');

module.exports = (query) => {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const q = " " + chalk.bold(query)
		rl.question(q, value => {
			rl.close();
			resolve(value);
		});
	})
}