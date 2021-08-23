import readline from 'readline';
import chalk from 'chalk';

export default (query: string) : Promise<string> => {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		}) as any;

		rl.input.on('keypress', () => {

			let len = rl.line.length;

			readline.moveCursor(rl.output, -len, 0);
			readline.clearLine(rl.output, 1);

			for (let i = 0; i < len; i++) {
				rl.output.write("*");
			}
		})

		const q = " " + chalk.bold(query);

		rl.question(q, (value: string) => {

			rl.history = rl.history.slice(1);
			rl.close();

	  		resolve(value);
		});
	});

}