import CubedFileManager from "../CubedFileManager";

export default async (instance: CubedFileManager) => {
    
    // Delete folder
    await instance.requestManager.removeFolder("", "");
    await instance.requestManager.createFolder("", "scripts");
}