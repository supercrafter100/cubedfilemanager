import CubedFileManager from "../CubedFileManager";

export default async (instance: CubedFileManager) : Promise<void> => {
    return new Promise(async (resolve) => {

        // A (hopefully) definitive list of all default files Skript puts in the scripts folder upon first install
        // Supports default files across different versions of Skript so not all files will be added on your server when Skript is installed
        const defaultScripts = [
            '-- Files prefixed with a hyphen are disabled! --',
            '-command with cooldown.sk',
            '-custom helmet.sk',
            '-disable weather.sk',
            '-eternal day.sk',
            '-furnace automatisation.sk',
            '-homes.sk',
            '-item command.sk',
            '-kill counter.sk',
            '-nerf endermen.sk',
            '-realistic drops.sk',
            '-simple god mode.sk',
            '-simple join and leave message.sk',
            '-simple motd.sk',
            '-teleport with compass.sk',
            '-vanilla gui.sk',
            '-plant with hoe.sk',
            '-nerf endermen.sk',
            '-kill counter.sk',
            '-equip anything.sk',
            '-drop fixes.sk',
            '-block head.sk'
        ]

        // Get all files in the file manager
        const url = `https://playerservers.com/queries/list_files/?dir=${instance.fixPath(instance.baseDir)}`;
        const json: any = await fetch(url, { headers: instance.headers as any }).then((res) => res.json());

        if (json.error) {
            instance.message_error('An unknown error occurred whilst fetching the files in the base folder!')
            process.exit()
        }

        for (const file of json.files) {
            if (defaultScripts.includes(file.filename)) {
                await instance.requestManager.removeFile(file.filename, '')
            }
        }

        instance.message_info('Finished removing all default scripts')
        resolve()
    })
}