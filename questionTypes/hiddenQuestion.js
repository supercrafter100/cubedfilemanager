const readline = require('readline');
const chalk = require('chalk');

module.exports = (query) => {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		
		rl.input.on('keypress', (c, k) => {

			let len = rl.line.length;

			readline.moveCursor(rl.output, -len, 0);
			readline.clearLine(rl.output, 1);

			for (let i = 0; i < len; i++) {
				rl.output.write("*");
			}
		})

		const q = " " + chalk.bold(query);

		rl.question(q, value => {

			rl.history = rl.history.slice(1);
			rl.close();
	  		resolve(value);
		});
	});

}