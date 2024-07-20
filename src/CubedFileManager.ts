import { ParsedArgs } from "minimist";
import RequestManager from "./lib/RequestsManager.js";
import SettingsManager from "./lib/SettingsManager.js";
import FileWatcher from './lib/FileWatcher.js';
import chalk from "chalk";
import select from '@inquirer/select';
import CryptoHandler from "./lib/CryptoHandler.js";
import { LoginMethods } from "./types/LoginTypes.js";
import normalQuestion from "./questions/normalQuestion.js";
import hiddenQuestion from "./questions/hiddenQuestion.js";
import Utility from "./lib/Utility.js";
import FileUploader from "./util/uploadScriptToDashboard.js";
import FileDownloader from "./util/syncScriptsToLocal.js";
import deleteScriptsFolder from "./util/deleteScriptsFolder.js";
import SocketManager from "./util/SocketManager.js";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import BackupLoader from "./util/backupScriptsToServer.js";
import deleteDefaultScripts from "./util/deleteDefaultScripts.js";

export default class CubedFileManager {

	public settingsManager: SettingsManager;
	public requestManager: RequestManager;
	public fileWatcher: FileWatcher;
	public cryptoManager: CryptoHandler;
	public utilities: Utility
	public socketManager: SocketManager | undefined;

	public rootDir: string
	public arguments: ParsedArgs;
	
	public sessionToken: string;
	public headers!: HeadersInit;
	public folderSupport: boolean = false;
	public logErrors: boolean = false;
	public username: string = "";
	public baseDir: string = "plugins/Skript/scripts";

	public temp_username: string | undefined;
	public temp_password: string | undefined;
	public temp_server: number | undefined;

	public cf_clearance: string | undefined;
	public userAgent: string;

	constructor(rootDir: string, args: ParsedArgs) {

		if (rootDir === ".") {
			this.rootDir = process.cwd();
		} else {
			this.rootDir = rootDir;
		}

		this.settingsManager = new SettingsManager(this);
		this.fileWatcher = new FileWatcher(this);
		this.requestManager = new RequestManager(this);
		this.cryptoManager = new CryptoHandler(this);
		this.utilities = new Utility(this);

		this.sessionToken = "";
		this.rootDir = rootDir;
		this.arguments = args;

		this.settingsManager.init();
		this.parseArguments();
		this.cryptoManager.init();

		this.userAgent = 'CubedFileManager'

		this.init();
	}

	private parseArguments() {
		if (this.arguments.init) {
			this.settingsManager.createJsonFile();
			process.exit(0);
		}

		// Arguments used for stuff

		if (this.arguments.foldersupport || this.arguments.fs || this.settingsManager.settings?.folderSupport) {
			this.folderSupport = true;
		} 

		if (this.arguments.logerrors || this.arguments.logerr || this.settingsManager.settings?.logErrors) {
			this.logErrors = true;
		}

		if (this.arguments.basedir || this.arguments.dir || this.settingsManager.settings?.baseDir) {
			this.baseDir = this.arguments.basedir || this.arguments.dir || this.settingsManager.settings?.baseDir!
			if (this.baseDir.startsWith('/')) this.baseDir = this.baseDir.slice(1, this.baseDir.length);
			if (this.baseDir.endsWith('/')) this.baseDir = this.baseDir.slice(0, this.baseDir.length - 1);
		}
	}

	private async init(failed = false) : Promise<any> {

		/**
		 * Logging into their account & getting a session ID
		 */

		// Gets boolean of whether or not they have pre-entered login details either in CubedCraft.json or saved in CFM that they wish to use
		let notSaved = !this.settingsManager.exists || !this.settingsManager.settings?.login?.useSavedAccount && (!this.settingsManager.settings?.login?.username || !this.settingsManager.settings?.login?.password)

		let loginMethod: LoginMethods;
		if (notSaved || (this.settingsManager.settings?.login?.useSavedAccount && this.cryptoManager.username.length < 1) || (this.settingsManager.settings?.login?.useSavedAccount && this.cryptoManager.password.length < 1) || failed)
			loginMethod = await this.askLoginMethod();
		else loginMethod = LoginMethods.AUTOMATIC;

		let username;
		let password;

		if (loginMethod == LoginMethods.MANUAL) {
			username = await normalQuestion('What is your username? ');
			password = await hiddenQuestion('What is your password? ');
		} else if (loginMethod == LoginMethods.RECONFIGURE) {
			username = this.cryptoManager.username;
			password = this.cryptoManager.password;
		} else if (loginMethod == LoginMethods.AUTOMATIC) {
			if (this.settingsManager.settings?.login?.useSavedAccount) {
				username = this.cryptoManager.username;
				password = this.cryptoManager.password;
			} else {
				username = this.settingsManager.settings?.login?.username
				password = this.settingsManager.settings?.login?.password
			}
		}
		
		if (!username || !password) {
			this.message_error('No username or password was found. Please try again.');
			process.exit(0);
		}

		this.temp_username = username;
		this.temp_password = password;

		const response = await this.requestManager.login(username, password);
		if (response == null) {
			return this.init(true);
		}

		if (loginMethod == LoginMethods.MANUAL) {
			const save_data = await select({
				pageSize: 2,
				message: "Do you want to save your login details for future use?",
				loop: false,
				choices: [
					{ value: 'Yes' },
					{ value: 'No' }
				]
			});

			if (save_data == "Yes") {
				this.cryptoManager.username = username;
				this.cryptoManager.password = password;
				this.cryptoManager.updateStorage();
			}
		}
	
		this.sessionToken = response;
		this.headers = {
			cookie: `PHPSESSID=${response}; ${this.cf_clearance ? `cf_clearance=${this.cf_clearance}` : ``}`,
			'user-agent': this.userAgent
		}

		/**
		 * Selecting a server to work on
		 */
		let server_selected = false;
		const servers_list = await this.requestManager.getServersInDashboard();
		if (this.settingsManager.settings?.server) {
			if (!servers_list.some(c => c.name.toLowerCase() == this.settingsManager.settings?.server?.toLowerCase())) {
				this.message_error("Specified server in CubedCraft.json was not found.");
			} else {
				const id = servers_list.find(c => c.name.toLowerCase() == this.settingsManager.settings?.server?.toLowerCase())?.id!
				await this.requestManager.selectServer(id);
				this.temp_server = id;

				server_selected = true;
			}
		}	

		if (!server_selected) {
			const server_name = await select({
				pageSize: 5,
				message: "What server are you working on?",
				loop: false,
				choices: servers_list.map(c => ({ value: c.name })),
			})

			const server = servers_list.find(c => c.name.toLowerCase() === server_name.toLowerCase());
			this.temp_server = server?.id!;
			this.requestManager.selectServer(server?.id!);
		}

		this.message_success(`Successfully selected a server to work on`);

		// Identify if the server is offline, because some major features won't work if this is the case
		const console_output = await this.requestManager.getConsoleContent();
		if (console_output == "The server is offline, Please start the server first") {
			this.message_warning("The server has been identified as offline, be aware that not all features will work when this is the case.")
		}

		// Checking if the logging script exists
		if (!(await this.requestManager.fileExists("", "cubedFileManager.sk"))) {
			this.message_info("No logging script found. Creating it for you...");
			const content = await fetch("https://raw.githubusercontent.com/supercrafter100/cubedfilemanager/master/src/misc/script.txt").then((res) => res.text());
			await this.requestManager.createFile("cubedFileManager.sk", content, "");
		}

		// Check if any special methods were inputted
		if (this.arguments.upload) {
			this.message_info("Starting to upload all local scripts to the server...");
			const uploader = new FileUploader(this);
			await uploader.uploadsFiles(this.rootDir);
			process.exit(0);
		}
		else if (this.arguments.sync) {
			this.message_info("Starting to download all scripts from the server...");
			const downloader = new FileDownloader(this);
			await downloader.downloadFiles("");
			process.exit(0);
		} else if (this.arguments.delete) {
			this.message_info("Deleting all scripts in the scripts folder...");
			await deleteScriptsFolder(this);
			process.exit(0);
		} else if (this.arguments.backup) {
			this.message_info("Starting to backup all local scripts to the server...");
			const uploader = new BackupLoader(this);
			await uploader.start();
			process.exit(0);
		} else if (this.arguments.deletedefaults) {
			this.message_info("Deleting all default scripts on the server...");
			await deleteDefaultScripts(this);
			process.exit(0);
		}
		
		if (this.settingsManager.settings?.autoSync) {
			this.message_info("autoSync is enabled in CubedCraft.json")
			this.message_info("Starting to download all scripts from the server...");
			const downloader = new FileDownloader(this);
			await downloader.downloadFiles("");
			this.message_success("All files were downloaded")
		}

		if (this.arguments.livesync || this.settingsManager.settings?.livesync) {
			if (await this.askLiveSyncPermission() == false) {
				this.message_error("User did not agree, not starting socket system...");
			} else {
				this.message_info('Live sync is enabled, starting socket...')
				this.socketManager = new SocketManager(this);
				this.socketManager.connect('https://cfm.supercrafter100.com/')
			};
		}

		// Starting file watcher
		this.fileWatcher.init();
	}

	/**
	 * Questions
	 */

	private askLoginMethod(): Promise<LoginMethods> {
		return new Promise(async (resolve) => {
			if (this.cryptoManager.username.length < 1 || this.cryptoManager.password.length < 1) {
				resolve(LoginMethods.MANUAL);
				return;
			}

			const choices = [
				`Log in as ${this.cryptoManager.username}`,
				`Change username and password for auto log in`,
				`Log in manually`
			];

			const startup_choice = await select({
				pageSize: 3,
				message: "How would you like to start the system?",
				loop: false,
				choices: choices.map(v => ({ value: v }))
			});

			if (startup_choice == "Change username and password for auto log in") {

				this.cryptoManager.username = await normalQuestion('What is your username? ');
				this.cryptoManager.password = await hiddenQuestion('What is your password? ');
				this.cryptoManager.updateStorage();

				resolve(LoginMethods.RECONFIGURE);

			} else if (startup_choice == `Log in as ${this.cryptoManager.username}`) {
				resolve(LoginMethods.AUTOMATIC)
			} else {
				resolve(LoginMethods.MANUAL);
			}
		})
	}

	private askLiveSyncPermission() : Promise<boolean> {
		return new Promise(async (resolve) => {
			const path = join(import.meta.dirname, './sync_permission')
			if (existsSync(path)) return resolve(true);

			const response = await normalQuestion("By using live sync, temporary access to your account must be granted to the server, do you agree to this? (y/n) ").then((response) => response.toLowerCase());
			if (["y", "n"].includes(response)) {
				if (response == "n") return resolve(false);

				writeFileSync(path, 'User has agreed to allow access to the server...');
				return resolve(true);
			}

			this.message_error("Invalid response, must be \"y\" or \"n\"")
			resolve(await this.askLiveSyncPermission());
		})
	}

	public ask2FACode(html: string, cookie: string) : Promise<void> {
		return new Promise(async (resolve) => {
			
			// ask code
			const response = await normalQuestion("Enter 2FA code from your authenticator app: ");

			// Attempt to run it through the 2FA stuff
			const success = await this.requestManager.submit2FACode(response, html, {
				'cookie': `PHPSESSID=${cookie}; ${this.cf_clearance ? `cf_clearance=${this.cf_clearance}` : ``}`,
				'user-agent': this.userAgent
			});
			if (!success) {
				this.message_error("Invalid 2FA code. Please try again...");
				return resolve(await this.ask2FACode(html, cookie));
			}
			resolve();
		})
	}


	/**
	 * Session verification
	 */

	public async check_session() {
		const expired = await this.requestManager.sessionIsExpired();
		if (expired) {
			this.message_info('Current session expired. Refreshing it!');
			if (!this.temp_server || !this.temp_password || !this.temp_username) {
				this.message_error('Failed to log back in. Closing system.');
				process.exit(0);
			}
			const response = await this.requestManager.login(this.temp_username, this.temp_password);

			if (response == null) {
				this.message_error('Failed to log back in. Closing system.');
				process.exit(0);
			}

			await this.requestManager.selectServer(this.temp_server);

			this.sessionToken = response!;
			this.headers = {
				cookie: `PHPSESSID=${response}; ${this.cf_clearance ? `cf_clearance=${this.cf_clearance}` : ``}`,
				'user-agent': this.userAgent
			}
		}
	}

	/*
		Fix paths to be compliant with how Cubed handles paths
	*/
	public fixPath(path: string) : string {
		path = path.replaceAll('\\', '/')
		if (path.endsWith('/')) path = path.slice(0, path.length - 1)
		if (!path.startsWith('/')) path = '/' + path
		return path
	}


	/**
	 * Messages
	 */
	public message_success(msg: string) {
		console.log(chalk.grey('[') + chalk.greenBright("✓") + chalk.grey("]") + " " + msg);
	}

	public message_error(msg: string) {
		console.log(chalk.grey('[') + chalk.redBright("x") + chalk.grey("]") + " " + msg);
	}

	public message_warning(msg: string) {
		console.log(chalk.grey('[') + chalk.yellow("!") + chalk.grey("]") + " " + msg);
	}

	public message_info(msg: string) {
		console.log(chalk.grey('[') + chalk.yellowBright("*") + chalk.grey("]") + " " + msg);
	}

	public message_log(msg: string) {
		console.log(chalk.grey(`[`) + chalk.blue(`${new Date(Date.now()).toLocaleTimeString()}`) + chalk.grey(']') + " " + msg);
	}

	public isAllowedExtension(name: string) : boolean {
		let isAllowed = false;
		for (const extension of this.settingsManager.settings!.extensions) {
			if (name.endsWith(extension)) isAllowed = true;
		}
		return isAllowed;
	}
}