const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');
const chalk = require('chalk');
const inquirer = require('inquirer');

const hiddenQuestion = require('../questionTypes/hiddenQuestion');
const normalQuestion = require('../questionTypes/normalQuestion');

const configStorage = require('../authentication/config');

module.exports = async () => {
	return new Promise(async (resolve) => {
		let userName;
		let password;

		let credentials = configStorage.readData()

		if (process.env.USER && process.env.PASS) {
			userName = process.env.USER;
			password = process.env.PASS;
		} else if (credentials) {
			userName = credentials.username;
			password = credentials.password;
		} else {
			userName = await normalQuestion('What is your username? ');
			password = await hiddenQuestion('What is your password? ');

			// Promting if they want to save their data

			const save = await normalQuestion('Do you want to save these credentials (encrypted)? (Yes / No) ');
			if (save.toLowerCase() === "yes") {
				configStorage.writeData(userName, password)
			}
		}
	
		/**
		 * First fetch for token!!!
		 */
	
		const url = 'https://playerservers.com/login';
		await fetch(url)
			.then(async (res) => {
				const html = await res.text();
				const $ = cheerio.load(html);
				const requestToken = $("input[name=token]").val();

				const cookie = res.headers
				.raw()
				["set-cookie"].find((s) => s.startsWith("PHPSESSID"))
				.split(";")[0]
				.split("=")[1];
		
				const params = new URLSearchParams();
				params.append('username', userName);
				params.append('password', password);
				params.append('token', requestToken);
		
				const success = await fetch(url, {
					method: 'POST',
					body: params,
					headers: {
						cookie: `PHPSESSID=${cookie};`
					}
				})
			.then((res) => res.text())
			.then((html) => html.includes(`replace("/dashboard/")`))
			.catch(e => console.log(e));

			if (success) {
				console.log(chalk.green('Correct credentials'))
				await getServers(cookie);
				resolve(cookie)
			} else {
				console.log(chalk.red('Invalid credentials'))
				process.exit();
			}
		}).catch(e => console.log(e))
	})
}


async function getServers(token) {
	return new Promise(async (resolve) => {
		const url = 'https://playerservers.com/account';
		await fetch(url, {
			headers: {
				cookie: `PHPSESSID=${token};`
			}
		})
		.then((res) => res.text())
		.then(async (html) => {
			
			let links = [];
			let names = [];
			let hrefs = [];

			const $ = cheerio.load(html);
			$('tr > td:nth-child(1)').each((index, element) => {


				let name = $(element).text();
				names.push(name);

			})

			$('tr > td:nth-child(6) > a').each((index, element) => {

				let href = $(element).attr('href');
				hrefs.push(href);
			})

			for (let i = 0; i < names.length; i++) {
				let name = names[i];
				let href = hrefs[i];

				links.push({ name: name, href: href })
			}

			let server_name

			if(process.env.SERVER) 
				server_name = process.env.SERVER
			else
				server_name = await inquirer.prompt([
					{
						name: "server_name",
						prefix: "",
						type: "list",
						pageSize: 5,
						message: "What server are you working on?",
						loop: false,
						choices: names,
					},
				]).then(o=>o.server_name)


			const server = links.find(c => c.name.toLowerCase() === server_name.toLowerCase());

			if(!server) throw new Error('Server not found')

			/**
			 * Final fetch to let the server know we selected a server
			 */

			fetch(server.href, {
				headers: {
					cookie: `PHPSESSID=${token};`
				}
			}).then(() => {
				resolve();
			})
			
		})
	})
} 
