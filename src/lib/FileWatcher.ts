import { readFileSync } from 'fs';
import CubedFileManager from "../CubedFileManager";
import chokidar from 'chokidar';
import { Spinner} from 'clui';
import p from 'path';
export default class FileWatcher {

	private instance: CubedFileManager;

	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	public init() {

		const spinner = new Spinner("Enabling file watcher");
		spinner.start();
		
		const started = Date.now();

		const watcher = chokidar.watch(this.instance.rootDir, {
			ignoreInitial: true,
			awaitWriteFinish: {
				stabilityThreshold: 1000
			}
		});

		watcher.on('error', (e) => {
			console.log(e);
			process.exit(0);
		});

		watcher.on('ready', () => {
			const time_passed = new Date(Date.now() - started).getSeconds();
			spinner.stop()
			this.instance.message_success(`File watcher started in ${time_passed} seconds`);

			this.instance.requestManager.sendCommand(`sendmsgtoops ${this.instance.username ? `&e${this.instance.username} ` : ""}&fConnected with &bCubedFileManager`)
		});

		watcher.on('add', async (path) => {
			const file = p.basename(path);
			const isSkript = file.endsWith('.sk');
			if (!isSkript) return;
			
			// Check session
			await this.instance.requestManager.checkAndUpdateSession();

			// Read file
			const content = readFileSync(path, 'utf8');
			
			// Folder support
			if (this.instance.folderSupport) {
				await this.instance.utilities.parseFolders(path);
			}

			// Create the file
			await this.instance.requestManager.createFile(file, content, path);
		})

		watcher.on('change', async (path) => {
			const file = p.basename(path);
			const isSkript = file.endsWith('.sk');
			if (!isSkript) return;

			// Check session
			await this.instance.requestManager.checkAndUpdateSession();

			// Read file
			const content = readFileSync(path, 'utf-8');

			// Folder support
			if (this.instance.folderSupport) {
				await this.instance.utilities.parseFolders(path);
			}

			// Edit file
			await this.instance.requestManager.editFile(file, content, path);
		})
	}
}