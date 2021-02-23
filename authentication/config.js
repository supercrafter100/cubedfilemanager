const fs = require('fs');
const path = require('path');

const encrypt = require('./encryption').encryptData
const decrypt = require('./encryption').decryptData

const oldEncryption = "cubedfilemanagerEncryptionKey";


function writeData(username, password) {
	const raw = fs.readFileSync(path.join(__dirname, './data.json'));
	
	let json;
	try {
		json = JSON.parse(raw);
	} catch (error) {
		return null
	}

	let encryption = ""

	if (!json.encryptionKey) {
		encryption = Math.random().toString(36).substring(2);
	} else {
		encryption = json.encryptionKey;
	}

	const object = {
		encryptionKey: encryption,
		username: encrypt(username, encryption), 
		password: encrypt(password, encryption)
	}

	fs.writeFileSync(path.join(__dirname, './data.json'), JSON.stringify(object, null, 2));
}

function readData() {
	const raw = fs.readFileSync(path.join(__dirname, './data.json'));
	
	let json;
	try {
		json = JSON.parse(raw);
	} catch (error) {
		return null
	}

	if (!json.username || !json.password) {
		return null
	}

	let encryption = "";

	if (!json.encryptionKey) {
		encryption = oldEncryption;
	} else {
		encryption = json.encryptionKey
	}

	const object = {
		username: decrypt(json.username, encryption),
		password: decrypt(json.password, encryption)
	}
	
	return object;
}

module.exports = {
	writeData, 
	readData
}