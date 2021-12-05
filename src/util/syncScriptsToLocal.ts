import fs from "fs";
import path from "path";
import CubedFileManager from "../CubedFileManager.js";
import fetch from 'node-fetch';
import { join } from "path";

export default class FileDownloader {


    private instance: CubedFileManager;

    constructor(instance: CubedFileManager) {
        this.instance = instance;
    }

    public async downloadFiles(dir: string) {
        // Get all files in the file manager
        const url = `https://playerservers.com/queries/list_files/?dir=${this.instance.fixPath(join(this.instance.baseDir, dir))}`;
        const json: any = await fetch(url, { headers: this.instance.headers as any }).then((res) => res.json());

        // Looping through all files
        for (const file of json.files) {
            const contents = await this.instance.requestManager.getFileContent(dir, file.filename);
            const p = path.join(this.instance.rootDir, '.', dir);
            
            await fs.promises.mkdir(p, { recursive: true });
            fs.writeFileSync(path.join(p, file.filename), contents);
        }

        for (const folder of json.folders) {
            await this.downloadFiles(`${dir}/${folder.foldername}/`);
        }
    }
}