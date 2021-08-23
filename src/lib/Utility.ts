import CubedFileManager from "../CubedFileManager";

export default class Utility {
	private instance: CubedFileManager;

	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	public parseFolders(path: string = "\\") : Promise<void> {
		return new Promise(async (resolve) => {
			let dirs = path.split('\\');
			dirs = dirs.slice(0, (dirs.length - 1));
			let currentPath;
			let previousPath;

			for (const dir of dirs) {

				if (currentPath) {
					previousPath = currentPath;
					currentPath += `/${dir}`;
				} else {
					previousPath = '/';
					currentPath = `/${dir}`;
				}

				/**
				 * Check if the directory exists
				 */
				const status = await this.instance.requestManager.folderExists(currentPath);
				if (status == false) {
					await this.instance.requestManager.createFolder(previousPath, dir);
				};
			}
	
			resolve();
		})
	}
}