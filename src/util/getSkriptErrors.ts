export default function getSkriptErrors(console_data: string, name: string) {

	console_data = console_data
		.replace(/<br \/>/g, "")
		.replace(/&quot;/g,'"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#039;/g, '\'');
	
	const lines = console_data.split('\n');

	let reading_error = false;

	let latest_error_lines = [];
	let latest_error_amount = 0;

	for (let i = 0; i < lines.length; i++) {
		const current_line = lines[i];
		if (current_line.includes(`[Skript] Reloading ${name}...`) && !reading_error) {
			
			reading_error = true;
			latest_error_lines = [];
			latest_error_amount = 0;
			latest_error_lines.push(current_line);
		}
		else if (current_line.includes(`[Skript] Encountered`) && reading_error) {
			
			reading_error = false;
			const split_error_line = current_line.split(' ');
			const error_count = split_error_line[5];
			latest_error_amount = parseInt(error_count);
		}
		else if (current_line.includes(`Successfully reloaded ${name}.`) && reading_error) {
			reading_error = false;
		}
		else if (reading_error) {
			latest_error_lines.push(current_line);
		}
	}

	// Getting the last error

	if (latest_error_amount > 0) {
		return {
			data: latest_error_lines.join('\n'),
			errors: latest_error_amount
		}
	}
}
