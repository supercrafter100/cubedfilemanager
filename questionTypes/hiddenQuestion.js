const readline = require('readline');
const chalk = require('chalk');

module.exports = (query) => {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		const stdin = process.openStdin();
		process.stdin.on('data', char => {
			char = char + '';
			switch (char) {
				case '\n':
				case '\r':
				case '\u0004':
					stdin.pause();
					break;
				default:
					process.stdout.clearLine();
					readline.cursorTo(process.stdout, 0);
					process.stdout.write(" " + chalk.bold(query) + Array(rl.line.length + 1).join('*'));
					break;
			}
		});

		const q = " " + chalk.bold(query);

		rl.question(q, value => {

			stdin.end();
			rl.history = rl.history.slice(1);
			rl.close();
	  		resolve(value);
		});
	});

}