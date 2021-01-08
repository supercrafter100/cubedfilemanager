const hiddenQuestion = require('../questionTypes/hiddenQuestion');
const normalQuestion = require('../questionTypes/normalQuestion');
const inquirer = require('inquirer');
const configStorage = require('../authentication/config');


module.exports = () => {
	return new Promise(async (resolve) => {
		/**
		 * Asking what they want
		 */

		const userData = configStorage.readData();
		if (userData === null) {
			return resolve("manual");
		}
		
		const choices = [
			`Log in as ${userData.username}`,
			`Change username and password for auto log in`,
			`Log in manually`
		]
		
		const { startup_choice } = await inquirer.prompt([
			{
				name: 'startup_choice',
				prefix: "",
				type: 'list',
				pageSize: 3,
				message: "How would you like to start the system?",
				loop: false,
				choices: choices
			}
		])

		if (startup_choice == "Change username and password for auto log in") {

			const userName = await normalQuestion('What is your username? ');
			const password = await hiddenQuestion('What is your password? ');

			configStorage.writeData(userName, password);
			return resolve("auto")
		} else if (startup_choice == `Log in as ${userData.username}`) {
			return resolve("auto")
		} else {
			return resolve("manual");
		}
	})
}