const cryptoJS = require('crypto-js');

function decryptData(data, encryptionKey) {
	const bytes = cryptoJS.AES.decrypt(data, encryptionKey)
	return bytes.toString(cryptoJS.enc.Utf8);
}

function encryptData(data, encryptionKey) {
	return cryptoJS.AES.encrypt(data, encryptionKey).toString();
}

module.exports = {
	encryptData,
	decryptData
}