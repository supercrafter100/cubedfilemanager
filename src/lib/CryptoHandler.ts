import cryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import CubedFileManager from '../CubedFileManager';

export default class CryptoHandler {

	private instance: CubedFileManager;

	public username: string = "";
	public password: string = "";
	private encryption_key: string = "";

	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	public init() {
		const file = path.join(__dirname, './data.json')
		if (!fs.existsSync(file)) {
			this.username = "";
			this.password = "";
			return;
		}

		this.instance.message_success('Username & Password found');

		const jsonData = JSON.parse(fs.readFileSync(file, 'utf8'));
		this.encryption_key = jsonData.encryptionKey;

		this.username = this.decodeData(jsonData.username, this.encryption_key);
		this.password = this.decodeData(jsonData.password, this.encryption_key);

	}

	public updateStorage() {
		
		this.instance.message_info('Writing to credentials storage');
		if (!this.encryption_key) {
			this.encryption_key = Math.random().toString(36).substring(2);
		}

		const file = path.join(__dirname, './data.json');
		const object = {
			encryptionKey: this.encryption_key,
			username: this.encodeData(this.username, this.encryption_key), 
			password: this.encodeData(this.password, this.encryption_key)
		}

		fs.writeFileSync(file, JSON.stringify(object, null, 2));
		this.instance.message_success("Credentials storage successfully saved");
	}

	private encodeData(text: string, key: string) {
		return cryptoJS.AES.encrypt(text, key).toString();
	}

	private decodeData(text: string, key: string) {
		const bytes = cryptoJS.AES.decrypt(text, key)
		return bytes.toString(cryptoJS.enc.Utf8);
	}
}