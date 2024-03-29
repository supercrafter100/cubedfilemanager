import { Settings } from '../types/Settings';
import fs from 'fs';
import path from 'path';
import CubedFileManager from '../CubedFileManager.js';

export default class SettingsManager {
	
	public settings: Settings | null;
	private instance: CubedFileManager;
	public exists: boolean = false;

	private defaultSettings: Settings = {
		login: {
			useSavedAccount: true,
			username: '',
			password: ''
		},
		server: '',
		folderSupport: false,
		logErrors: false,
		baseDir: "plugins/Skript/scripts",
		livesync: false,
		extensions: [".sk"],
		autoSync: false
	}

	constructor(instance: CubedFileManager) {
		this.instance = instance;
		this.settings = null;
	}

	public init() : Promise<void> {
		return new Promise((resolve) => {
			const exists = fs.existsSync(path.join(this.instance.rootDir, 'CubedCraft.json'));
			if (exists) {
				this.instance.message_success("Found CubedCraft.json file");
				this.settings = JSON.parse(fs.readFileSync(path.join(this.instance.rootDir, 'CubedCraft.json'), 'utf-8'));

				// Check all keys to see if they exist
				for (const key of Object.keys(this.defaultSettings)) {
					if (!Object.keys(this.settings!).includes(key)) {
						(this.settings as any)[key] = (this.defaultSettings as any)[key];
					}
				}
				this.exists = true;
			} else {
				this.settings = this.defaultSettings;
			}
			resolve();
		})
	}

	public createJsonFile() {
		const exists = fs.existsSync(path.join(this.instance.rootDir, 'CubedCraft.json'));
		if (exists) {
			this.instance.message_error("CubedCraft.json already exists!");
			return;
		}

		fs.writeFileSync(path.join(this.instance.rootDir, 'CubedCraft.json'), JSON.stringify(this.defaultSettings, null, 2));
		this.instance.message_success(" Created CubedCraft.json file");
	}
}