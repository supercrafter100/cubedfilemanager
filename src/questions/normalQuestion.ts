import readline from 'readline';
import chalk from 'chalk';

export default (query: string) : Promise<string> => {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const q = " " + chalk.bold(query)
		rl.question(q, (value: string) => {
			rl.close();
			resolve(value);
		});
	})
}