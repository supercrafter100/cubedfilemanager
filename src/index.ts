#!/usr/bin/env node

import figlet from 'figlet';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import update_notifier from 'update-notifier';
import CubedFileManager from './CubedFileManager';
import { basename, join, resolve } from 'path';

import minimist from 'minimist';


/**
 * Notify users if a new update is ready
 */
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
update_notifier({ pkg, shouldNotifyInNpmScript: true }).notify();

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
			$ cfm [path] [args]
	
		Options
			--init Create a CubedCraft.json files with settings you can edit for your workspace
			--logerrors --logerr Log errors associated with your script to the console. (Doesn't work 100% of the time)
			--upload Upload all your files in your directory to scripts directory of the server.
			--delete Delete all the files from the scripts directory of the server
			--sync Synchronise all files from the file manager to your machine (will work with folders if there are any in the file manager)
			--help -help Show this help menu
`
let argv;
let path;

if (!(process.argv[2] == basename(process.argv[0])) && !process.argv.includes('-help') && !process.argv.includes('--help')) {
	argv = minimist(process.argv.slice(2));
	path = process.cwd();
} else if (process.argv.includes('-help') || process.argv.includes('--help')) {
	console.log(helpMessage);
	process.exit(0);
} else {
	argv = minimist(process.argv.slice(3));
	path = resolve(process.cwd(), process.argv[2])
}

new CubedFileManager(path, argv);

