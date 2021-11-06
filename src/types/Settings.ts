export interface Settings {
	username: string | undefined,
	login: {
		useSavedAccount: boolean | undefined;
		username: string;
		password: string;
	}
	server: string | undefined,
	folderSupport: boolean | undefined,
	logErrors: boolean | undefined,
	baseDir: string | undefined;
	livesync: boolean | undefined;
	extensions: string[];
	autoSync: boolean | undefined;
}