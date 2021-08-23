export default (console_data: string, name: string) => {

	console_data = console_data.replace(/<br \/>/g, "").replace(/&quot;/g,'"')
	const lines = console_data.split('\n');

	let reading_error = false;
	let current_data = "";

	const skript_reloads = [];


	for (let i = 0; i < lines.length; i++) {
		const current_line = lines[i]
		if (current_line.includes(`[Skript] Reloading ${name}...`) && !reading_error) {
			reading_error = true;
			current_data = "";
		} else if (current_line.includes(`[Skript] Encountered`) && reading_error) {
			reading_error = false;
			// parsing the error count :P
			const split_error_line = current_line.split(' ');
			const error_count = split_error_line[5];
			skript_reloads.push({
				data: current_data,
				errors: parseInt(error_count)
			});
		} else if (current_line.includes(`Successfully reloaded ${name}.`) && reading_error) {
			reading_error = false;
			skript_reloads.push({
				data: current_data,
				errors: 0
			});
		} else if (reading_error) {
			current_data += `\n${current_line}`;
		}
	}

	// Getting the last error
	const last_error = skript_reloads[skript_reloads.length - 1];
	if (last_error) {
		if (last_error.errors > 0) {
			return last_error;
		}
	}
}