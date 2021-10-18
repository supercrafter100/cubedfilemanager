import CubedFileManager from "../CubedFileManager.js";

export default async (instance: CubedFileManager) => {
    
    // Delete folder
    await instance.requestManager.removeFolder("", "");

    // Get name of current folder and path to the directory that contains that folder
    const pathParts = instance.baseDir.split(`/`)
    const directoryName = pathParts.pop()?.toString() ?? ''
    const pathToInnerDirectory = pathParts.join(`/`)

    // Create folder again
    await instance.requestManager.createFolder("", directoryName, pathToInnerDirectory);
    
}