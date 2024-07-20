#!/usr/bin/env node

import chalk from 'chalk';
import { readFileSync } from 'fs';
import update_notifier from 'update-notifier';
import CubedFileManager from './CubedFileManager.js';
import { basename, join, resolve } from 'path';

import minimist from 'minimist';


/**
 * Make sure user is on a compatible NodeJS version
 */

if (typeof process !== 'undefined' && parseInt(process.versions.node.split('.')[0]) < 18) {
	console.error(chalk.red('CubedFileManager is unable to start due to an issue that must be resolved.'))
	console.error(chalk.grey('[') + chalk.redBright("x") + chalk.grey("]") + " " + 'Your Node.js version is currently', process.versions.node)
	console.error(chalk.grey('[') + chalk.redBright("x") + chalk.grey("]") + " " + 'Please update it to version 18 or higher from https://nodejs.org/ to be able to use CubedFileManager!')
	process.exit(1)
}

/**
 * Notify users if a new update is ready
 */
const pkg = JSON.parse(readFileSync(join(import.meta.dirname, '../package.json'), 'utf8'));
update_notifier({ pkg, updateCheckInterval: 0 }).notify({ isGlobal: true });

/**
 * Write a banner saying the package name
 */
console.log(
	chalk.yellow(
		// Banner generated via figlet
		'   ____           _                  _   _____   _   _          __  __                                               \n' +
  		'  / ___|  _   _  | |__     ___    __| | |  ___| (_) | |   ___  |  \\/  |   __ _   _ __     __ _    __ _    ___   _ __ \n' +
  		" | |     | | | | | '_ \\   / _ \\  / _` | | |_    | | | |  / _ \\ | |\\/| |  / _` | | '_ \\   / _` |  / _` |  / _ \\ | '__|\n" +
  		' | |___  | |_| | | |_) | |  __/ | (_| | |  _|   | | | | |  __/ | |  | | | (_| | | | | | | (_| | | (_| | |  __/ | |   \n' +
  		'  \\____|  \\__,_| |_.__/   \\___|  \\__,_| |_|     |_| |_|  \\___| |_|  |_|  \\__,_| |_| |_|  \\__,_|  \\__, |  \\___| |_|   \n' +
  		'                                                                                                 |___/               '
	)
);
/**
 * Input values & help message
 */
const helpMessage = `
		Usage
			$ cfm [path] [args]
	
		Options
			--init Create a CubedCraft.json files with settings you can edit for your workspace
			--logerrors --logerr Log errors associated with your script to the console. (Doesn't work 100% of the time)
			--upload Upload all your files in your directory to scripts directory of the server.
			--delete Delete all the files from the scripts directory of the server
			--sync Synchronise all files from the file manager to your machine (will work with folders if there are any in the file manager)
			--livesync Create a websocket connection with the CubedFileManager server. If anyone working on the same server edits a file and is using cubedfilemanager, it will get updated immediatly on your local filesystem as well.
			--backup Back all local files to plugins/Skript/backups/backup-<time>/
			--deletedefaults Removes all default scripts on the server
			--help -help Show this help menu
`
let argv;
let path;

if (!(process.argv[2] == basename(process.argv[0])) && !process.argv.includes('-help') && !process.argv.includes('--help') && !process.argv.includes('--h') && !process.argv.includes('-h')) {
	argv = minimist(process.argv.slice(2));
	path = process.cwd();
} else if (process.argv.includes('-help') || process.argv.includes('--help') || process.argv.includes('-h') || process.argv.includes('--h')) {
	console.log(helpMessage);
	process.exit(0);
} else {
	argv = minimist(process.argv.slice(3));
	path = resolve(process.cwd(), process.argv[2])
}

new CubedFileManager(path, argv);

