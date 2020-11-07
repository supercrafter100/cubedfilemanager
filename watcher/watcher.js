const chokidar = require('chokidar');
const fs = require('fs')
const chalk = require('chalk');
const { Spinner } = require('clui');
const watchPath = require('../index').watchpath;
const cli = require('../index').flags;

const create = require('../methods/create');
const createFolders = require('../methods/folders');
const remove = require('../methods/remove');
const edit = require('../methods/edit');
const sendCommand = require('../methods/sendCommand');
const deleteDir = require('../methods/deleteDir');

const spin = new Spinner('Enabling file watcher');
spin.start();
let watcher = chokidar.watch(watchPath, {
	ignoreInitial: true,
	awaitWriteFinish: {
		stabilityThreshold: 1000,
	},
});

watcher.on("ready", () => {
	spin.stop();
	if (!cli.flags.name){
		sendCommand(`sendmsgtoops Connected with &bCubedFileManager`);
	}
	else {
		sendCommand(`sendmsgtoops &e${cli.flags.name} &fConnected with &bCubedFileManager`)
	}
	
	console.log(chalk.blue('https://playerservers.com/dashboard'))
})


// New file
watcher.on("add", async (path) => {

	let file = require("path").basename(path);
	if (!file.endsWith('.sk')) return;

	fs.readFile(path, async (err, content) => {

		if (cli.flags.folderSupport) {
			await createFolders(path)
			.then(async () => {
				await create(file, content, path);
			})	
		} else {
			await create(file, content);
		}
	});
});


// Saved file
watcher.on("change", async (path) => {
	let file = require("path").basename(path);
	if (!file.endsWith('.sk')) return;
	fs.readFile(path, async (err, content) => {
		if (cli.flags.folderSupport) {
			await createFolders(path)
			.then(async () => {
				await edit(file, content, path);
			})
		} else {
			await edit(file, content, "");
		}
	});
});


// Deleted file
watcher.on("unlink", async (path) => {
	let file = require("path").basename(path);

	if (!file.endsWith('.sk')) return;

	if (cli.flags.folderSupport) {
		await remove(file, path);
	} else {
		await remove(file);
	}
});


watcher.on("unlinkDir", (path) => {
	deleteDir(path);
})