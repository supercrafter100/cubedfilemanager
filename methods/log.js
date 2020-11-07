const chalk = require('chalk');

module.exports = (message) => {
	console.log(chalk.blue(`[${new Date(Date.now()).toLocaleTimeString()}] ${message}`));
}