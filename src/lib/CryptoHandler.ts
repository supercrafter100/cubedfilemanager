import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import CubedFileManager from '../CubedFileManager.js';

export default class CryptoHandler {

	private instance: CubedFileManager;

	public username: string = "";
	public password: string = "";
	private encryption_key: string = "";

	constructor(instance: CubedFileManager) {
		this.instance = instance;
	}

	public init() {
		const file = path.join(import.meta.dirname, './data.json')
		if (!fs.existsSync(file)) {
			this.username = "";
			this.password = "";
			return;
		}

		this.instance.message_success('Username & Password found');

		const jsonData = JSON.parse(fs.readFileSync(file, 'utf8'));
		this.encryption_key = jsonData.encryptionKey;

		this.username = this.decryptData(jsonData.username, this.encryption_key);
		this.password = this.decryptData(jsonData.password, this.encryption_key);
	}

	public updateStorage() {
		
		this.instance.message_info('Writing to credentials storage');
		if (!this.encryption_key) {
			this.encryption_key = Math.random().toString(36).substring(2);
		}

		const file = path.join(import.meta.dirname, './data.json');
		const object = {
			encryptionKey: this.encryption_key,
			username: this.encryptData(this.username, this.encryption_key), 
			password: this.encryptData(this.password, this.encryption_key)
		}

		fs.writeFileSync(file, JSON.stringify(object, null, 2));
		this.instance.message_success("Credentials storage successfully saved");
	}

	// The following methods are a port of crypto-js AES encryption to native node:crypto implementations

	private createHashes(password: Buffer) {
		const md5Hashes = [];
		let digest = password;
		for (let i = 0; i < 3; i++) {
			md5Hashes[i] = crypto.createHash('md5').update(digest).digest();
			digest = Buffer.concat([md5Hashes[i], password]);
		}
		return md5Hashes
	}

	private encryptData(text: string, secret: string) {
		const salt = crypto.randomBytes(8);
		const password = Buffer.concat([Buffer.from(secret, 'binary'), salt]);
		const hashes = this.createHashes(password);

		const key = Buffer.concat([hashes[0], hashes[1]]);
		const iv = hashes[2];
		const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

		return Buffer.concat([Buffer.from('Salted__'), salt, cipher.update(text), cipher.final()]).toString('base64');
	}

	private decryptData(text: string, secret: string) {
		const cypher = Buffer.from(text, 'base64');
		const salt = cypher.subarray(8, 16);
		const password = Buffer.concat([Buffer.from(secret, 'binary'), salt]);
		const hashes = this.createHashes(password);

		const key = Buffer.concat([hashes[0], hashes[1]]);
		const iv = hashes[2];
		const contents = cypher.subarray(16);
		const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

		return decipher.update(contents).toString() + decipher.final().toString();
	}
}