#!/usr/bin/env node

/**
 * Imports
 */

require('dotenv').config();

const fetch = require('node-fetch');
const meow = require('meow');


const figlet = require('figlet');
const chalk = require('chalk');

const getToken = require('./request/getToken');
const getInput = require('./request/getInput');

const createBroadcaster = require('./request/installScript');
const checkSession = require('./request/checkSession');


/**
 * Start up
 */


// Startup message
console.log(
	chalk.yellow(
	  figlet.textSync('CubedFileManager', { horizontalLayout: 'full' })
	)
  );

// Meow
const cli = meow(
	`
		Usagef
			$ cfm <path> <args>
		
		Options
			--session, -s  The session key (For faster starting)
			--name, -n Say who connected with CFM
			--folderSupport, -fs Enables folder suppor (creates folders in your file manager depending on your folders in here)
			
`,
	{
		flags: {
			session: {
				type: "string",
				alias: "s",
			},
			name: {
				type: "string",
				alias: "n",
			},
			folderSupport: {
				type: "boolean",
				alias: "fs"
			}
		},
	}
);


/**
 * Check CLI stuff
 */
let headers;
let cookie;


// storing token

if (!cli.flags.session) {
	stuff();
}

async function stuff() {

	// Automatic login stuff xd
	const input = await getInput()
	.then(async (response) => {
		await getToken(response)
		.then(async (token) => {
			headers = {
				cookie: `PHPSESSID=${token};`
			};
			cookie = token;
	
			await createBroadcaster();
			
			require('./watcher/watcher')
		})
	})

}
	
if (cli.flags.session) {
	cookie = cli.flags.session;
	headers = {
		cookie: `PHPSESSID=${cookie};`,
	};
}

module.exports = {
	flags: cli,
	watchpath: cli.input[0],

	getHeaders() {
		return headers;
	},

	getToken() {
		return cookie;
	}
}
async function stuff2() {
	await checkSession();
	require('./watcher/watcher')

}

if (cli.flags.session) {
	stuff2();
}