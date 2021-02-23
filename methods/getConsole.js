const { default: fetch } = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = () => {
	return new Promise(async (resolve) => {
		const headers = require('../index').getHeaders();
		const url = `https://playerservers.com/dashboard/console-backend/`
	
		const data = await fetch(url, {
			headers,
		}).then((res) => res.text());

		resolve(data);
	})
};