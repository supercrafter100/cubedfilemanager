export interface Settings {
	username: string | undefined,
	server: string | undefined,
	folderSupport: boolean | undefined,
	logErrors: boolean | undefined,
	baseDir: string | undefined;
	livesync: boolean | undefined;
	extensions: string[];
}