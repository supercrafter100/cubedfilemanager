import { readFileSync } from 'fs';
import CubedFileManager from "../CubedFileManager.js";
import chokidar from 'chokidar';
import p from 'path';
import Spinner from '../util/Spinner.js';
import { Mutex } from '../util/Mutex.js';
export default class FileWatcher {

	private instance: CubedFileManager;
	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	public init() {
		// Mutex to ensure only one file is processed at once
		const mutex = new Mutex();
		// Set to store files that are currently being processed so that a file is not needlessly processed twice
		const pendingFiles = new Set<string>();

		const spinner = new Spinner("Enabling file watcher");
		spinner.start();
		
		const started = Date.now();

		const watcher = chokidar.watch(this.instance.rootDir, {
			ignoreInitial: true,
			ignorePermissionErrors: true,
			
			awaitWriteFinish: {
				stabilityThreshold: 50
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

			pendingFiles.add(path);
			await mutex.lock();

			try {
				pendingFiles.delete(path);

				// Read file
				const content = readFileSync(path, 'utf8');

				if (this.instance.socketManager?.lastUpdatedFile == file && this.instance.socketManager?.lastUpdatedContent == content) return;

				// Folder support
				if (this.instance.folderSupport) {
					await this.instance.utilities.parseFolders(this.preparePath(path));
				}

				// Create the file
				await this.instance.requestManager.createFile(file, content, this.preparePath(path));
				this.instance.socketManager?.write("file_create", file, content, this.preparePath(path))
			} finally {
				this.instance.headers = {};
				mutex.release();
			}
		});

		watcher.on('change', async (path) => {
			const file = p.basename(path);
			if (!this.instance.isAllowedExtension(file)) return;

			if (pendingFiles.has(path)) return;
			pendingFiles.add(path);
			await mutex.lock();
			pendingFiles.delete(path);

			try {
				// Read file
				const content = readFileSync(path, 'utf-8');

				// Checking that this chance isn't from the socket
				if (this.instance.socketManager?.lastUpdatedFile == file && this.instance.socketManager?.lastUpdatedContent == content) return;

				// Folder support
				if (this.instance.folderSupport) {
					await this.instance.utilities.parseFolders(this.preparePath(path));
				}

				// Edit file
				await this.instance.requestManager.editFile(file, content, this.preparePath(path));
				this.instance.socketManager?.write("file_edit", file, content, this.preparePath(path))
			} finally {
				mutex.release();
			}
		});

		watcher.on('unlink', async (path) => {
			await mutex.lock();

			try {
				const file = p.basename(path);
				if (!this.instance.isAllowedExtension(file)) return;

				if (this.instance.socketManager?.lastUpdatedFile == file) return;

				// Delete file
				await this.instance.requestManager.removeFile(file, this.preparePath(path));
				this.instance.socketManager?.write("file_delete", file, this.preparePath(path))
			} finally {
				mutex.release();
			}
		});

		watcher.on('unlinkDir', async (path) => {
			await mutex.lock();

			try {
				const dir = p.basename(path);

				if (this.instance.socketManager?.lastUpdatedFile == dir) return;

				// Delete folder
				await this.instance.requestManager.removeFolder(dir, this.preparePath(path));
			} finally {
				mutex.release();
			}
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

