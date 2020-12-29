const cryptoJS = require('crypto-js');
const encryptionKey = "cubedfilemanagerEncryptionKey";

function decryptData(data) {
	const bytes = cryptoJS.AES.decrypt(data, encryptionKey)
	return bytes.toString(cryptoJS.enc.Utf8);
}

function encryptData(data) {
	return cryptoJS.AES.encrypt(data, encryptionKey).toString();
}

module.exports = {
	encryptData,
	decryptData
}