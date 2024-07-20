import CubedFileManager from "../CubedFileManager";
import type { Socket } from "socket.io-client";
import { join } from "path";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import fs from 'fs';

export default class SocketManager {

    private instance: CubedFileManager;
    private socket: Socket | undefined;

    public lastUpdatedFile: string = "";
    public lastUpdatedContent: string = "";

    constructor(instance: CubedFileManager) {
        this.instance = instance;
    }

    public async connect(url: string) {
        // Lazy load socket.io-client module
        const io = (await import('socket.io-client')).io;
        this.socket = io(url);
        this.socket.on('connect', () => this.authenticate());
    }

    private authenticate() {
        this.socket?.emit("authenticate", this.instance.sessionToken, this.instance.temp_server);
        this.socket?.on('Unauthorized', () => {
            this.instance.message_error("Could not start live session. Authentication failed. If this issue persists, create an issue on the github repository...");
            this.socket?.close();
        });
        
        this.socket?.on('authenticated', () => this.setEvents());
    }

    private setEvents() {
        this.socket?.on('file_create', (username, name, content, path) => this.handle_handleFileCreateEvent(username, name, content, path));
        this.socket?.on('file_edit', (username, name, content, path) => this.handle_handleFileEditEvent(username, name, content, path));
        this.socket?.on('file_delete', (username, name, path) => this.handle_handleFileDeleteEvent(username, name, path));
    }

    public write(event: string, ...data: any) {
        this.socket?.emit(event, ...data);
    } 

    private async handle_handleFileCreateEvent(username: string, name: string, content: string, path: string) {
        if (!this.instance.isAllowedExtension(name)) return
        if (!this.instance.isAllowedExtension(path)) return

        this.instance.message_info(`Incoming file creation of file ${name} (by ${username})`);
        this.lastUpdatedFile = name;
        this.lastUpdatedContent = content;

        const writePath = this.instance.folderSupport ? join(this.instance.rootDir, path) : join(this.instance.rootDir, name);
        if (this.instance.folderSupport) await fs.promises.mkdir(join(this.instance.rootDir, path.replace(name, "")), { recursive: true });

        writeFileSync(writePath, content);
    }

    private async handle_handleFileEditEvent(username: string, name: string, content: string, path: string) {
        if (!this.instance.isAllowedExtension(name)) return
        if (!this.instance.isAllowedExtension(path)) return

        this.instance.message_info(`Incoming file edit of file ${name} (by ${username})`);
        this.lastUpdatedFile = name;
        this.lastUpdatedContent = content;

        const writePath = this.instance.folderSupport ? join(this.instance.rootDir, path) : join(this.instance.rootDir, name);
        if (this.instance.folderSupport) await fs.promises.mkdir(join(this.instance.rootDir, path.replace(name, "")), { recursive: true });
        writeFileSync(writePath, content);
    }

    private async handle_handleFileDeleteEvent(username: string, name: string, path: string) {
        if (!this.instance.isAllowedExtension(name)) return
        if (!this.instance.isAllowedExtension(path)) return

        this.instance.message_info(`Incoming file delete of file ${name} (by ${username})`);
        this.lastUpdatedFile = name;

        const writePath = this.instance.folderSupport ? join(this.instance.rootDir, path) : join(this.instance.rootDir, name);
        if (existsSync(writePath)) {
            unlinkSync(writePath);
        }
    }
}