import { lstatSync, readdirSync, readFileSync } from "fs";
import path from "path";
import CubedFileManager from "../CubedFileManager.js";

export default class BackupLoader {


    private manager: CubedFileManager;

    constructor(manager: CubedFileManager) {
        this.manager = manager;
    }

    public async start() {
        this.manager.baseDir = "plugins/Skript";
        if (!(await this.manager.requestManager.folderExists("/file-backups"))) {
            await this.manager.requestManager.createFolder("", "file-backups");
        }
        const folderName = `backup-${new Date().toLocaleString().replace(/\//g, "-").replace(/\-/g, "-").replace(/\:/g, "-").replace(/ +/g, "-")}`;
        await this.manager.requestManager.createFolder("/file-backups", folderName);
        this.manager.baseDir = `plugins/Skript/file-backups/${folderName}`;

        await this.uploadsFiles(this.manager.rootDir);
    }

    public async uploadsFiles(dir: string) {
        const files = readdirSync(dir);
        for (let i = 0; i < files.length; i++) {
            const file = path.join(dir, files[i]);
            
            if (lstatSync(file).isDirectory()) {
                await this.uploadsFiles(file);
            }
            else if (!files[i].endsWith('.sk')) {
                i == i;
            }
            else {
                const contents = readFileSync(file, 'utf8');

                if (this.manager.folderSupport) {
                    await this.manager.utilities.parseFolders(this.preparePath(path.join(dir, files[i])));
                }
                await this.manager.requestManager.createFile(files[i], contents, this.preparePath(path.join(dir, files[i])));
            }
        }
    }

    private preparePath(path: string) : string {
		const updatedBasePath = (this.manager.rootDir).replaceAll("/", "\\");
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