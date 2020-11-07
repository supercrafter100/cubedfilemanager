const { default: fetch } = require('node-fetch');
const { URLSearchParams } = require('url');

module.exports = async (command) => {
	const headers = require('../index').getHeaders();
	const url = `https://playerservers.com/dashboard/console-backend/`

	const params = new URLSearchParams();
	params.append("sendcmd", command);
	await fetch(url, {
		method: "POST",
		headers,
		body: params
	});
};