import { readFileSync } from 'fs';
import CubedFileManager from "../CubedFileManager.js";
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
			ignorePermissionErrors: true,
			
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
			if (!this.instance.isAllowedExtension(file)) return;
			
			// Read file
			const content = readFileSync(path, 'utf8');

			if (this.instance.socketManager?.lastUpdatedFile == file && this.instance.socketManager?.lastUpdatedContent == content) return;

			// Check session
			await this.instance.requestManager.checkAndUpdateSession();
			
			// Folder support
			if (this.instance.folderSupport) {
				await this.instance.utilities.parseFolders(this.preparePath(path));
			}

			// Create the file
			await this.instance.requestManager.createFile(file, content, this.preparePath(path));
			this.instance.socketManager?.write("file_create", file, content, this.preparePath(path))
		});

		watcher.on('change', async (path) => {
			const file = p.basename(path);
			if (!this.instance.isAllowedExtension(file)) return;

			// Read file
			const content = readFileSync(path, 'utf-8');

			// Checking that this chance isn't from the socket
			if (this.instance.socketManager?.lastUpdatedFile == file && this.instance.socketManager?.lastUpdatedContent == content) return;

			// Check session
			await this.instance.requestManager.checkAndUpdateSession();

			// Folder support
			if (this.instance.folderSupport) {
				await this.instance.utilities.parseFolders(this.preparePath(path));
			}

			// Edit file
			await this.instance.requestManager.editFile(file, content, this.preparePath(path));
			this.instance.socketManager?.write("file_edit", file, content, this.preparePath(path))

		});

		watcher.on('unlink', async (path) => {
			const file = p.basename(path);
			if (!this.instance.isAllowedExtension(file)) return;

			if (this.instance.socketManager?.lastUpdatedFile == file) return;

			// Check session
			await this.instance.requestManager.checkAndUpdateSession();

			// Delete file
			await this.instance.requestManager.removeFile(file, this.preparePath(path));
			this.instance.socketManager?.write("file_delete", file, this.preparePath(path))
		});

		watcher.on('unlinkDir', async (path) => {
			const dir = p.basename(path);

			if (this.instance.socketManager?.lastUpdatedFile == dir) return;

			// Check session
			await this.instance.requestManager.checkAndUpdateSession();

			// Delete folder
			await this.instance.requestManager.removeFolder(dir, this.preparePath(path));
		})
	}

    private preparePath(path: string) : string {
		const updatedBasePath = (this.instance.rootDir).replaceAll("/", "\\");
		const updatedPath = path.replaceAll('/', '\\');

		let newPath = updatedPath.replaceAll(updatedBasePath, "");
		if (newPath.endsWith('\\')) {
			newPath = newPath.substr(0, newPath.length - 1).slice(1);
		} if (newPath.startsWith('\\')) {
            newPath = newPath.substr(1)
        } if (newPath.includes('\\\\')) {
            newPath = newPath.replaceAll('\\\\', '\\')
        }
		return newPath
	}
}

