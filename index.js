#!/usr/bin/env node

/**
 * Imports
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const meow = require('meow');


const figlet = require('figlet');
const chalk = require('chalk');

const getToken = require('./request/getToken');
const getInput = require('./request/getInput');

const createBroadcaster = require('./request/installScript');
const checkSession = require('./request/checkSession');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json')));
require('update-notifier')({ pkg }).notify();

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
			--logerrors Shows all data returned by the console when reloading a file.
			--upload Upload all your files in your directory to the server.
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
			},
			logerrors: {
				type: "boolean",
				alias: "logerr"
			},
			upload: {
				type: "boolean",
				alias: "u"
			}
		},
	}
);


/**
 * Check CLI stuff
 */
let headers;
let cookie;
let logstuff = cli.flags.logerrors;


// storing token

if (!cli.flags.session) {
	stuff();
}

async function stuff() {

	// Automatic login stuff xd
	await getInput()
	.then(async (response) => {
		await getToken(response)
		.then(async (token) => {
			headers = {
				cookie: `PHPSESSID=${token};`
			};
			cookie = token;
	
			await createBroadcaster();
			
			if (cli.flags.upload) {
				const uploader = require('./methods/uploadWorkspace');
				const upload = new uploader();

				upload.load({ loadDir: cli.input[0] })
			} else {
				require('./watcher/watcher');
			}
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
	},

	getErrorLog() {
		return logstuff;
	}
}
async function stuff2() {
	await checkSession();
	require('./watcher/watcher')

}

if (cli.flags.session) {
	stuff2();
}