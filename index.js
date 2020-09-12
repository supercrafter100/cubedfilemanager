#!/usr/bin/env node

/**
 * Imports
 */

const chokidar = require('chokidar');
const fs = require('fs');

const fetch = require('node-fetch');
const meow = require('meow');
const cheerio = require('cheerio');
const { URLSearchParams } = require("url");

const figlet = require('figlet');
const chalk = require('chalk');

const CLI = require('clui');
const Spinner = CLI.Spinner;


/**
 * Start up
 */


// Startup message
console.log(
	chalk.yellow(
	  figlet.textSync('CubedFileManager', { horizontalLayout: 'full' })
	)
  );

// Base URL
const baseurl = "https://playerservers.com/dashboard/";

// Meow
const cli = meow(
	`
		Usagef
			$ cfm <path> <args>
		
		Options
			--session, -s  The session key (For faster starting)
			--name, -n Say who connected with CFM
			--path, -p The path to edit (starting with "/"),
			--autoreload, -ar Disable automatically reloading files when saved
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
			path: {
				type: "string",
				alias: "p",
			},
			autoreload: {
				type: "string",
				alias: "ar",
			},
		},
	}
);


/**
 * Check CLI stuff
 */

let token = "";
let filePath = "/plugins/Skript/scripts";

// Asking for session token
if (!cli.input.length) {
	return cli.showHelp();
}

// Checking for session token
if (!cli.flags.session) {
	return cli.showHelp();
}

// Checking if path is set
if (cli.flags.path) {
	filePath = cli.flags.path
}


// storing token
token = cli.flags.session;
let headers = {
	cookie: `PHPSESSID=${token};`,
};


// If the token exists we can just like assign it
// Checking if the token is correct
const status = new Spinner('Checking your session token. Please wait')
status.start();


/**
 * Fetching
 */


// Fetching token via login
fetch(baseurl, { headers })
.then((res) => res.text())
.then(async (html) => {
	status.stop();
	if (html) {
		if (html.includes("/login/")) {
			console.log(chalk.red('Invalid session token'));
			process.exit();
		}
	}

	console.log(chalk.green('Valid session token'));
	checkStatus();
});


// Checking if the server is online or not
async function checkStatus() {
	const spin = new Spinner('Checking server status. Please wait')
	spin.start()
	const url = baseurl + "console-backend/"

	fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {
			spin.stop()
			if (html === 'The server is offline, Please start the server first') {
				console.log(chalk.red('Server is offline!'));
				process.exit();
			}

			console.log(chalk.green('Server is online'))
			if (!cli.flags.path) {
				installBroadcaster()
			} else {
				console.log(chalk.blue(baseurl))
			}
		})
	
}


// If the broadcasting script isn't in the
// server, this will add it to the server.
async function installBroadcaster() {
	const spin = new Spinner('Checking for broadcasting script. Please wait')
	spin.start()
	const url = 'https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts/cubedFileManager.sk&dir=/plugins/Skript/scripts'
	fetch(url, { headers })
	.then((res) => res.text())
		.then(async (html) => {
			spin.stop()
			if (html === '<script data-cfasync="false">window.location.replace("/dashboard/filemanager");</script>') {
				console.log(chalk.red('Did not find broadcast script. Creating it for you...'))
				fs.readFile('./lib/script.txt', async (err, content) => {
					await create('cubedFileManager.sk', content);
					await sendCommand(`sk enable cubedFileManager`)
					await sendCommand(`sk reload cubedFileManager`)
					await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fCreated${content.length ? " and enabled" : ""} &bCubedFileManager.sk`);
					console.log(chalk.blue(baseurl))

				})
			} else {
				console.log(chalk.blue(baseurl))
			}
		})
}

/**
 * Chokidar - file watching
 */


// Setting path
let watchPath = cli.input[0];


// Setting up the watcher
let watcher = chokidar.watch(watchPath, {
	ignoreInitial: true,
	awaitWriteFinish: {
		stabilityThreshold: 1000,
	},
});


// New file
watcher.on("add", (path) => {
	let file = require("path").basename(path);

	fs.readFile(path, async (err, content) => {
		await create(file, content);
		if (!cli.flags.path) {
			await sendCommand(`sk enable ${file}`)
			await sendCommand(`sk reload ${file}`)
			await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fCreated${content.length ? " and enabled" : ""} &b${file}`);
		} else {
			await sendCommand(`sendmsgtoops Created &b${file}`)
		}
		
		
	});
});


// Saved file
watcher.on("change", async (path) => {
	let file = require("path").basename(path);
	fs.readFile(path, async (err, content) => {

		// Checking if the file already exists or not
		fileExists(file).then(async (res) => {
			if (res == false) {
				// Doesn't exist
				await create(file, content);
				if (!cli.flags.path) {
					await sendCommand(`sk enable ${file}`)
					await sendCommand(`sk reload ${file}`)
					await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fCreated${content.length ? " and enabled" : ""} &b${file}`);
				} else {
					await sendCommand(`sendmsgtoops Created &b${file}`)
				}
			} else {
				// Exists
				await edit(file, content);
				await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fSaved file &b${file}`);
				if (!cli.flags.path) {
					/* 
					If autoreloads are undefined that means
					their enabled.
					*/
					if (!cli.flags.autoreload) {
						await sendCommand(`sk reload ${file}`);
						await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fReloaded file &b${file}`);
					}
				}
			}
		})

	});
});


// Deleted file
watcher.on("unlink", async (path) => {
	let file = require("path").basename(path);
	
	if (!cli.flags.path) {
		await sendCommand(`sk disable ${file}`);
	}

	await remove(file);
	await sendCommand(`sendmsgtoops &e${cli.flags.name ? cli.flags.name : ""} &fDeleted file &b${file}`);
});



// Create file function
async function create(name, content = "") {
	const spin = new Spinner(`Creating file ${name}...`);
	spin.start();
	let url = baseurl + `filemanager/?action=new&dir=${filePath}`
	await fetch(url, { headers })
		.then((res) => res.text())
		.then(async (html) => {
			
			// Getting the file name and extension
			let Name = await name.split('.')[0];
			let extension = await name.split('.')[1];
			
			// Getting the edit token
			const $ = cheerio.load(html);
			const editToken = $("input[name=token]").val();

			// Assigning parameters
			const params = new URLSearchParams();
			params.append("token", editToken);
			params.append("edit-file-name", Name);
			params.append("edit-file-content", content);
			params.append("edit-file-sub", "Save");
			params.append("ext", extension);

			// Posting the result
			await fetch(url, {
				method: "POST",
				headers,
				body: params,
			}).then((save) => {
				spin.stop()
				log(`Created file ${Name}.${extension}`)
			});
		})
}


// Edit file function
async function edit(name, content) {
	const spin = new Spinner(`Editing file ${name}...`);
	spin.start();
	let url = `${baseurl}filemanager/&action=edit&medit=${filePath}/${name}&dir=${filePath}/`;
	
	await fetch(url, {
		headers,
	})
		.then((res) => res.text())
		.then(async (html) => {

			// Getting the file name and extension
			let Name = await name.split('.')[0];
			let extension = await name.split('.')[1];

			// Getting edit token
			const $ = cheerio.load(html);
			const editToken = $("input[name=token]").val();

			// Parameters
			const params = new URLSearchParams();
			params.append("token", editToken);
			params.append("edit-file-name", Name);
			params.append("edit-file-content", content);
			params.append("edit-file-sub", "Save");

			await fetch(url, {
				method: "POST",
				headers,
				body: params,
			}).then((save) => {
				spin.stop();
				log(`Saved file ${Name}.${extension}`);
			});
		})
}


// Delete file function
async function remove(name) {
	const spin = new Spinner(`Deleting file ${name}...`);
	spin.start();
	let url;
	if (!cli.flags.path) {
		url = `${baseurl}filemanager/&action=delete&delete=${filePath}/-${name}&dir=${filePath}/`
	} else {
		url = `${baseurl}filemanager/&action=delete&delete=${filePath}/${name}&dir=${filePath}/`
	}
	await fetch(
		url,
		{
			headers,
		}
	).then((remove) => {
		spin.stop();
		log(`Deleted file ${name}`)
	});
}


// send a command to the console of the playerserver
async function sendCommand(command) {
	const params = new URLSearchParams();
	params.append("sendcmd", command);
	await fetch(baseurl + "console-backend/", {
		method: "POST",
		headers,
		body: params,
	});
}

function log(data) {
	console.log(chalk.blue(`[${new Date(Date.now()).toLocaleTimeString()}] ${data}`));
}

async function fileExists(file) {
	return new Promise((resolve, reject) => {
		const spin = new Spinner('Checking if file exists')
		spin.start()
		const url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=${filePath}/${file}&dir=${filePath}`
		fetch(url, { headers })
		.then((res) => res.text())
			.then(async (html) => {
				spin.stop()
				if (html === '<script data-cfasync="false">window.location.replace("/dashboard/filemanager");</script>') {
					resolve(false)
				} else {
					resolve(true)
				}
			})
	})
}

if (!cli.flags.name){
	sendCommand(`sendmsgtoops Connected with &bCubedSK`);
}
else {
	sendCommand(`sendmsgtoops &e${cli.flags.name} &fConnected with &bCubedSK`)
}
