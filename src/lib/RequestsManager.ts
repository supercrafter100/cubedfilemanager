import cheerio from "cheerio";
import CubedFileManager from "../CubedFileManager.js";
import getSkriptErrors from '../util/getSkriptErrors.js';
import { ResponseTypes } from '../types/LoginTypes.js';
import normalQuestion from "../questions/normalQuestion.js";
import Spinner from "../util/Spinner.js";

export default class RequestManager {

	private instance: CubedFileManager;

	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	/**
	 * Methods used for file stuff
	 */

	/**
	 * Create a file on the dashboard
	 * @param name The name of te file
	 * @param content The content of the file
	 * @param rawPath The path to the file in the file manager
	 * @param commands Whether or not to run reload and log commands upon create
	 * @returns Promise that resolves when the file is made
	 */
	public createFile(name: string, content: string = "", rawPath: string, commands: boolean = true): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;

			let path: string;
			const spin = new Spinner(`Creating file ${name}...`);

			if (this.instance.folderSupport && rawPath.length > 0) {
				let normalpath = rawPath.split('\\')
				path = normalpath.slice(0, normalpath.length - 1).join('/');
			} else {
				path = "";
			}

			const url = `https://playerservers.com/dashboard/filemanager/?action=new&dir=/${this.instance.baseDir}/${path}`;
			spin.start();
			await fetch(url, { headers: headers as any })
				.then(async (res) => {
					// Check if session expired
					if (res.status === 302) {
						spin.stop();
						await this.updateSession();
						resolve(this.createFile(name, content, rawPath, commands));
					}
					return res.text();
				})
				.then(async (html) => {
					if (html === '') return;

					/**
					 * First fetch is to get the edit token
					 */

					const fileExtension = getFileExtension(name);
					const replacement = "." + fileExtension;
					const fileName = name.replace(replacement, "");

					const $ = cheerio.load(html);
					const editToken = $("input[name=token]").val();

					const params = new URLSearchParams();
					params.append("token", editToken as string);
					params.append("edit-file-name", fileName);
					params.append("edit-file-content", content);
					params.append("edit-file-sub", "Save");
					params.append("ext", fileExtension);

					/**
					 * Fetching a second time to actually make the file
					 */

					await fetch(url, {
						method: "POST",
						headers: headers as any,
						body: params as any
					}).then(async () => {
						spin.stop();
						this.instance.message_log(`Created file ${fileName}.${fileExtension}`)
						resolve();

						if (commands) {
							await this.sendCommand(`sk reload ${this.instance.folderSupport ? `${path}/${name}` : name}`)
							await this.sendCommand(`sendmsgtoops &e${this.instance.username ? this.instance.username : ""} &fCreated${content.length ? " and enabled" : ""} &b${this.instance.folderSupport ? `${path}/${name}` : name}`);
						}
					})
				})

		})
	}

	/**
	 * Create a folder on the dashboard
	 * @param dir The directory the folder has to be made in
	 * @param dirName The name of the folder
	 * @param baseDir The base directory to create the folder in (defaults to the base directory of the instance)
	 * @returns Promise that resolves when the folder is made
	 */
	public createFolder(dir: string, dirName: string, baseDir: string = this.instance.baseDir): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;
			const spin = new Spinner('Creating new folder');

			/**
			 * First fetch is to get the token
			 */
			spin.start();
			const url = `https://playerservers.com/dashboard/filemanager/?action=new_folder&dir=/${baseDir}${dir}`;

			await fetch(url, { headers: headers as any })
				.then(async (res) => {
					// Check if session expired
					if (res.status === 302) {
						spin.stop();
						await this.updateSession();
						resolve(this.createFolder(dir, dirName, baseDir));
					}
					return res.text();
				})
				.then(async (html) => {
					if (html === '') return;

					const $ = cheerio.load(html);
					const editToken = $("input[name=token]").val();

					const params = new URLSearchParams();
					params.append("new-folder-name", dirName);
					params.append("token", editToken as string);
					params.append("edit-file-sub", "Save");

					/**
					 * Fetching a second time to create the actual directory
					 */

					await fetch(url, {
						method: "POST",
						headers: headers as any,
						body: params as any
					}).then((e) => {
						spin.stop();
						this.instance.message_log(`Created folder ${dirName}`);
						resolve();
					})
				})
		})
	}

	/**
	 * Edit a file on the dashboard
	 * @param name The name of the file
	 * @param content The content of the file
	 * @param rawPath The path to the file in the file manager
	 */
	public editFile(name: string, content: string, rawPath: string): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;

			let path: string;
			const spin = new Spinner(`Editing file ${name}...`);

			if (this.instance.folderSupport && rawPath.length > 0) {
				let normalpath = rawPath.split('\\')
				path = normalpath.slice(0, normalpath.length - 1).join('/');
			} else {
				path = "";
			}

			const url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=/${this.instance.baseDir}/${path}/${name}&dir=/${this.instance.baseDir}/${path}`;
			spin.start();

			await fetch(url, {
				headers: headers,
				redirect: 'manual'
			})
				.then(async (res) => {
					// Check if session expired
					if (res.status === 302) {
						spin.stop();
						await this.updateSession();
						resolve(this.editFile(name, content, rawPath));
					}
					return res.text();
				})
				.then(async (html) => {
					if (html === '') return;

					/**
					 * First fetch for getting edit token
					 */

					const fileExtension = getFileExtension(name);
					const fileName = name.replace(("." + fileExtension), '');

					const $ = cheerio.load(html);
					const editToken = $("input[name=token]").val();

					const params = new URLSearchParams();
					params.append("token", editToken as string);
					params.append("edit-file-name", fileName);
					params.append("edit-file-content", content);
					params.append("edit-file-sub", "Save");

					await fetch(url, {
						method: "POST",
						headers: headers as any,
						body: params as any,
					}).then(async () => {
						spin.stop();
						this.instance.message_log(`Edited file ${name}`);
						resolve();

						await this.sendCommand(`sendmsgtoops &e${this.instance.username ? this.instance.username : ""} &fSaved file &b${this.instance.folderSupport ? `${path}/${name}` : name}`);
						await this.sendCommand(`sk reload ${this.instance.folderSupport ? `${path}/${name}` : name}`)
						await this.sendCommand(`sendmsgtoops &e${this.instance.username ? this.instance.username : ""} &fReloaded file &b${this.instance.folderSupport ? `${path}/${name}` : name}`);

						if (!this.instance.settingsManager.settings?.logErrors) return resolve();

						const console_content = await this.getConsoleContent();
						const skript_errors = getSkriptErrors(console_content, name);

						if (skript_errors) {
							this.instance.message_error('Encountered an error when reloading ' + name);
							for (const line of skript_errors.data.split("\n")) {
								this.instance.message_error(line)
							}
							this.instance.message_error(`Script reloaded with ${skript_errors.errors} errors`);
						}
					})
				})
		})
	}

	/**
	 * Delete a file on the dashboard
	 * @param name The name of the file
	 * @param rawPath The path of the file in the file manager
	 */
	public removeFile(name: string, rawPath: string): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;

			let path: string;
			const spin = new Spinner(`Deleting file ${name}...`);

			if (this.instance.folderSupport && rawPath.length > 0) {
				let normalpath = rawPath.split('\\')
				path = normalpath.slice(0, normalpath.length - 1).join('/');
			} else {
				path = "";
			}

			spin.start();

			// Disabling the script so it gets unloaded from the server
			await this.sendCommand(`sk disable ${this.instance.folderSupport ? `${path}/${name}` : name}`);

			// Initial fetch to get the delete token
			const url = `https://playerservers.com/dashboard/filemanager/&dir=${this.instance.baseDir}/${path}`;
			const html = await fetch(url, { headers: headers as any }).then((res) => res.text());

			const editToken = getDeleteToken(html);
			if (editToken == null) {
				return this.instance.message_error("The delete token could not be retrieved. The HTML of the website likely changed. Please report this to Supercrafter100#6600 on discord.");
			}

			const deleteURL = "https://playerservers.com/dashboard/filemanager/&action=delete";
			const params = new URLSearchParams();
			params.append("targetFile", `/${this.instance.baseDir}/${path}/${name.startsWith('-') ? name : '-' + name}`);
			params.append("target", `/${this.instance.baseDir}/${path}/${name.startsWith('-') ? name : '-' + name}`);
			params.append("action", "delete");
			params.append("token", editToken);

			await fetch(deleteURL, {
				headers: headers as any,
				method: "POST",
				body: params as any
			})
				.then(async () => {
					spin.stop();

					this.instance.message_log(`Deleted file ${name}`);
					await this.sendCommand(`sendmsgtoops &e${this.instance.username ? this.instance.username : ""} &fDeleted file &b${this.instance.folderSupport ? `${path}/${name}` : name}`);

					resolve();
				})
		})
	}

	/**
	 * Delete a folder on the dashboard
	 * @param name The name of the folder
	 * @param rawPath The path of the folder in the file manager
	 */
	public removeFolder(name: string, rawPath: string): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;

			let path: string;
			const spin = new Spinner(`Deleting file ${name}...`);

			if (this.instance.folderSupport && rawPath.length > 0) {
				let normalpath = rawPath.split('\\')
				path = normalpath.slice(0, normalpath.length - 1).join('/');
			} else {
				path = "";
			}

			spin.start();

			// Initial fetch to get the delete token
			const url = `https://playerservers.com/dashboard/filemanager/&dir=${this.instance.baseDir}/${path}`;
			const html = await fetch(url, { headers: headers as any }).then((res) => res.text());

			const editToken = getDeleteToken(html);
			if (editToken == null) {
				return this.instance.message_error("The delete token could not be retrieved. The HTML of the website likely changed. Please report this to Supercrafter100#6600 on discord.");
			}

			const deleteURL = "https://playerservers.com/dashboard/filemanager/&action=delete";
			const params = new URLSearchParams();
			params.append("targetFile", `/${this.instance.baseDir}/${path}/${name}`);
			params.append("target", `/${this.instance.baseDir}/${path}/${name}`);
			params.append("action", "delete");
			params.append("token", editToken);

			await fetch(deleteURL, {
				headers: headers as any,
				method: "POST",
				body: params as any
			})
				.then(async () => {
					spin.stop();

					this.instance.message_log(`Deleted folder ${name}`);
					await this.sendCommand(`sendmsgtoops &e${this.instance.username ? this.instance.username : ""} &fDeleted folder &b${this.instance.folderSupport ? `${path}/${name}` : name}`);

					resolve();
				})
		})
	}

	/**
	 * Check if a folder exists on the file manager
	 * @param dir The directory to check
	 * @returns Promise that resolves with a boolean that is true if the folder exists and false if it doesn't
	 */
	public folderExists(dir: string): Promise<boolean> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers
			const url = `https://playerservers.com/queries/list_files/&dir=/${this.instance.baseDir}${dir}`;
			await fetch(url, { headers: headers as any })
				.then((res) => res.json())
				.then(async (json: any) => {
					if (json.error == true) {
						resolve(false);
					}
					resolve(true);
				})
		})
	}

	/**
	 * Check if a file exists on the file manager
	 * @param dir The directory to check instance
	 * @param file The name of the file to check (including the extension)
	 * @returns Promise that resolves with a boolean that is true if the file exists and false if it doesn't
	 */
	public fileExists(dir: string, file: string): Promise<boolean> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;
			const url = `https://playerservers.com/queries/list_files/?dir=/${this.instance.baseDir}${dir}`;
			const json = await fetch(url, { headers: headers as any })
				.then((res) => res.json());

			if (json.error && json.code === 5) {
				this.instance.message_error(`Folder "${this.instance.baseDir}" does not exist on the server!`)
				process.exit()
			} else if (json.error) {
				this.instance.message_error(`An unknown error occured fetching files from "${this.instance.baseDir}"!`)
				process.exit()
			}

			// Checking if the file exists
			const exists = json.files.some((c: any) => c.filename === file);
			resolve(exists);
		})
	}

	public getConsoleContent(): Promise<string> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;
			const url = `https://playerservers.com/queries/console_backend/`

			const data = await fetch(url, {
				headers: headers as any,
			}).then((res) => res.text());

			resolve(data);
		})
	}

	/**
	 * Get the content of a file on the dashboard
	 * @param path The path to the file
	 * @param file The name of the file
	 * @returns {Promise<string>} The contents of the file
	 */
	public getFileContent(path: string, file: string): Promise<string> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;
			const url = `https://playerservers.com/dashboard/filemanager/&action=edit&medit=/plugins/Skript/scripts/${path}${file}&dir=/plugins/Skript/scripts${path}`;
			const html = await fetch(url, { headers: headers as any, }).then((res) => res.text());

			const $ = cheerio.load(html);
			const contents = $('#code').text();
			resolve(contents);
		})
	}

	/**
	 *  Methods used for logging in
	 */

	/**
	 * Log into an account and get a session ID in return if the login was successful
	 * @param username The username to login with
	 * @param password The password to login with
	 * @returns Promise that resolves with the phpsessid token
	 */
	public login(username: string, password: string): Promise<null | string> {
		return new Promise(async (resolve) => {
			const url = 'https://playerservers.com/login';
			await fetch(url, {
				headers: {
					cookie: this.instance.cf_clearance ? `cf_clearance=${this.instance.cf_clearance}` : ``,
					'user-agent': this.instance.userAgent
				}
			})
				.then(async (res) => {
					const html = await res.text();

					// Cloudflare challenge
					if (html.includes('Please Wait... | Cloudflare')) {
						this.instance.message_warning('PlayerServers.com appears to have attack mode enabled.')
						this.instance.message_info('Please open https://playerservers.com in your browser, complete the Cloudflare challenge and then find the cookie named "cf_clearance".')
						this.instance.message_warning('Please note: this fix is far from perfect and issues could still occur.')
						this.instance.cf_clearance = (await normalQuestion('Please enter the "cf_clearance" cookie: ')).trim();
						this.instance.userAgent = (await normalQuestion('Please enter your browser user-agent (you can find this at https://www.whatismybrowser.com/detect/what-is-my-user-agent/): ')).trim()
						return this.login(username, password).then(result => resolve(result))
					}

					const $ = cheerio.load(html);
					const requestToken = $("input[name=token]").val();

					const cookie = res.headers.getSetCookie().find((s: string) => s.startsWith("PHPSESSID"))
						?.split(";")[0]
						.split("=")[1];

					if (!cookie) {
						this.instance.message_error('Could not find "PHPSESSID" cookie in login response.');
						return resolve(null);
					}

					const params = new URLSearchParams();
					params.append('username', username);
					params.append('password', password);
					params.append('token', requestToken as string);

					const response = await fetch(url, {
						method: 'POST',
						body: params as any,
						headers: {
							cookie: `PHPSESSID=${cookie}; ${this.instance.cf_clearance ? `cf_clearance=${this.instance.cf_clearance}` : ``}`,
							'user-agent': this.instance.userAgent
						},
						redirect: 'manual'
					})
						.then(async (res) => {
							if (res.status === 302) return ResponseTypes.SUCCESS;

							const html = await res.text();
							if (html.includes(`Two Factor Authentication`)) return ResponseTypes.TFA;
							else return ResponseTypes.FAILURE;
						})
						.catch(e => console.error(e));

					if (response == ResponseTypes.SUCCESS) {
						this.instance.username = await this.getUsername({ cookie: `PHPSESSID=${cookie}; ${this.instance.cf_clearance ? `cf_clearance=${this.instance.cf_clearance}` : ``}`, 'user-agent': this.instance.userAgent })
						this.instance.message_success(`Logged in as ${this.instance.username}`)
						resolve(cookie);
					} else if (response == ResponseTypes.FAILURE) {
						this.instance.message_error(`Failed to log in as ${username}`)
						resolve(null);
					} else if (response == ResponseTypes.TFA) {
						await this.instance.ask2FACode(html, cookie);
						this.instance.username = await this.getUsername({ cookie: `PHPSESSID=${cookie}; ${this.instance.cf_clearance ? `cf_clearance=${this.instance.cf_clearance}` : ``}`, 'user-agent': this.instance.userAgent })
						this.instance.message_success(`Logged in as ${this.instance.username}`)
						resolve(cookie);
					}
				})
		});
	}

	public submit2FACode(code: string, html: string, headers: object = this.instance.headers): Promise<boolean> {
		return new Promise(async (resolve) => {
			const url = 'https://playerservers.com/login';
			const $ = cheerio.load(html);

			// Get the edit token				
			const token = $("input[name=token]").val();

			const params = new URLSearchParams();
			params.append('tfa_code', code);
			params.append('tfa', "true");
			params.append('token', token);

			// Fetch 2nd time to actually login
			const success = await fetch(url, {
				method: 'POST',
				headers: headers as any,
				body: params as any
			}).then((res) => res.text()).then((res) => !res.includes('Invalid code, please try again.'));

			resolve(success);
		})
	}

	/**
	 * Get all servers the user has access to on their file manager
	 * @returns Array of all servers the user has access to
	 */
	public getServersInDashboard(): Promise<{ name: string, id: number }[]> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers;
			const url = 'https://playerservers.com/account';
			await fetch(url, {
				headers: headers as any
			})
				.then((res) => res.text())
				.then(async (html) => {

					const links = [];
					const names: string[] = [];
					const hrefs: string[] = [];

					const $ = cheerio.load(html);
					$('tr > td:nth-child(1)').each((index, element) => {
						const name = $(element).text();
						names.push(name);
					})

					$('tr > td:nth-child(4) > a, tr > td:nth-child(6) > a').each((index, element) => {
						const href = $(element).attr('href');
						if (href) {
							hrefs.push(href);
						}
					})

					for (let i = 0; i < names.length; i++) {
						const name = names[i];
						const id = parseInt(hrefs[i].split('?s=')[1]);

						links.push({ name: name, id: id })
					}

					resolve(links);
				})
		})
	}

	/**
	 * Select a server to edit on the dashboard
	 * @param id The server ID to select
	 * @returns A promise that resolves when the server is selected
	 */
	public selectServer(id: number): Promise<void> {
		return new Promise(async (resolve) => {
			const url = `https://playerservers.com/dashboard/?s=${id}`;
			await fetch(url, {
				headers: this.instance.headers as any
			})
			resolve();
		})
	}

	/**
	 * Check if the session token has expired
	 * @returns A promise that resolves with a boolean that indicates if the session is expired
	 */
	public sessionIsExpired(): Promise<boolean> {
		return new Promise(async (resolve) => {
			const url = `https://playerservers.com/dashboard/`;
			resolve(await fetch(url, {
				headers: this.instance.headers as any,
				redirect: 'manual'
			})
				.then((res) => res.status === 302));
		})
	}

	/**
	 * Send a command to the server
	 * @param cmd The command to send to the server
	 * @returns A promise that resolves once the command has been sent
	 */
	public sendCommand(cmd: string): Promise<void> {
		return new Promise(async (resolve) => {
			const headers = this.instance.headers
			const url = `https://playerservers.com/queries/console_backend/`

			const params = new URLSearchParams();
			params.append("sendcmd", cmd);
			await fetch(url, {
				method: "POST",
				headers: headers as any,
				body: params as any
			});
			resolve();
		})
	}

	/**
	 * Updates the session based on a new login
	 */
	public async updateSession() {
		this.instance.message_info('Current session expired. Refreshing it!');

		const token = await this.login(this.instance.temp_username!, this.instance.temp_password!);

		if (token == null) {
			this.instance.message_error('Failed to log back in. Closing system.');
			process.exit(0);
		}

		this.instance.sessionToken = token!;
		this.instance.headers = {
			cookie: `PHPSESSID=${token};`
		}
		await this.selectServer(this.instance.temp_server!);
	}

	/**
	 * Check if a session needs to be updated or not
	 * @returns {Promise<void>} A promise that resolves once the session has been checked and renewed if neccesary
	 */
	public checkAndUpdateSession(): Promise<void> {
		return new Promise(async (resolve) => {
			const isExpired = await this.sessionIsExpired();

			if (isExpired) {
				await this.updateSession();
			}
			resolve();
		})
	}

	/**
	 * Gets the username of the currently logged in user
	 * @returns {Promise<string>} A promise that resolves to the username of the logged in user as a string
	 */
	public getUsername(headers: object = this.instance.headers): Promise<string> {
		return new Promise(async (resolve) => {
			const url = `https://playerservers.com/account`;

			const res = await fetch(url, { headers: headers as any });
			const html = await res.text();

			const $ = cheerio.load(html);
			const element = $(`#content > nav > ul > li > a`);

			resolve(element.text().trim());
		})
	}
}

/**
 * Get the file extension of a file
 * @param fname The file name
 * @returns The file extension
 */
function getFileExtension(fname: string) {
	return fname.slice((Math.max(0, fname.lastIndexOf(".")) || Infinity) + 1);
}

function getDeleteToken(html: string) {
	const $ = cheerio.load(html);
	const webJavaScript = $($("script").get()[8]).html();
	if (webJavaScript == null) return null;

	// Getting the token (this is really hardcoded but I don't know a more efficient way to extract this)
	const token = (webJavaScript.match(/token: \"([\w\d]+)\"/) as RegExpMatchArray)[1];
	return token;
}
