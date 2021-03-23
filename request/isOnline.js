const fetch = require('node-fetch');

module.exports = () => {
	return new Promise(async (resolve) => {

		const headers = require('../index').getHeaders();
		const url = 'https://playerservers.com/dashboard/console-backend';

		const response = await fetch(url, { headers }).then((res) => res.text());
		if (response == "The server is offline, Please start the server first") resolve(false);
		resolve(true);
	})
}