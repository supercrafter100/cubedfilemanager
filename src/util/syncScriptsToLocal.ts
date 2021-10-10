import fs from "fs";
import path from "path";
import CubedFileManager from "../CubedFileManager";
import fetch from 'node-fetch';

export default class FileDownloader {


    private manager: CubedFileManager;

    constructor(manager: CubedFileManager) {
        this.manager = manager;
    }

    public async downloadFiles(dir: string) {
        // Get all files in the file manager
        const url = `https://playerservers.com/queries/list_files/?dir=/plugins/Skript/scripts${dir}`;
        const json = await fetch(url, { headers: this.manager.headers as any }).then((res) => res.json());

        // Looping through all files
        for (const file of json.files) {
            const contents = await this.manager.requestManager.getFileContent(dir, file.filename);
            const p = path.join(this.manager.rootDir, '.', dir);
            
            await fs.promises.mkdir(p, { recursive: true });
            fs.writeFileSync(path.join(p, file.filename), contents);
        }

        for (const folder of json.folders) {
            await this.downloadFiles(`${dir}/${folder.foldername}/`);
        }
    }
}