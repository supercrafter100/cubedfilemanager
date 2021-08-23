#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import update_notifier from 'update-notifier';
import CubedFileManager from './CubedFileManager';

import minimist from 'minimist';


/**
 * Notify users if a new update is ready
 */
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
update_notifier({ pkg }).notify();

/**
 * Write a banner saying the package name
 */
console.log(
	chalk.yellow(
	  figlet.textSync('CubedFileManager', { horizontalLayout: 'full' })
	)
);
/**
 * Input values & help message
 */
const helpMessage = `
		Usage
			$ cfm <path> <args>
	
		Options
			--name, -n Say who connected with CFM
			--folderSupport, -fs Enables folder suppor (creates folders in your file manager depending on your folders in here)
			--logerrors, -logerr Shows all data returned by the console when reloading a file.
			--upload Upload all your files in your directory to scripts directory of the server.
			--delete Delete all the files from the scripts directory of the server
			--sync Synchronise all files from the file manager to your machine (will work with folders if there are any in the file manager)
			--init Create a cubedfilemanager.json file to keep track of settings.
			--dir The base directory to work from in your file manager. Defaults to "plugins/Skript/scripts"
`

if (!process.argv[2]) {
	console.log(helpMessage);
	process.exit(0);
}
const argv = minimist(process.argv.slice(3));

new CubedFileManager(process.argv[2], argv);

