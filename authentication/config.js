const fs = require('fs');
const path = require('path');

const encrypt = require('./encryption').encryptData
const decrypt = require('./encryption').decryptData

function writeData(username, password) {
	const object = {
		username: encrypt(username), 
		password: encrypt(password)
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

	const object = {
		username: decrypt(json.username),
		password: decrypt(json.password)
	}
	return object;
}

module.exports = {
	writeData, 
	readData
}