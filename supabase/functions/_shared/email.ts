export interface SendSpreadsheetEmailParams {
	to: string;
	subject: string;
	description: string;
	spreadsheetBase64: string;
	filename: string;
}

export async function sendSpreadsheetEmail(
	params: SendSpreadsheetEmailParams,
): Promise<void> {
	const apiKey = Deno.env.get("MAILEROO_API_KEY");
	if (!apiKey) throw new Error("MAILEROO_API_KEY is not set");

	const fromEmail = Deno.env.get("MAILEROO_FROM_EMAIL") ??
		"mail@noreply.triploom.app";
	const { to, subject, description, spreadsheetBase64, filename } = params;

	// Decode base64 spreadsheet to binary for the attachment
	const binaryStr = atob(spreadsheetBase64);
	const bytes = new Uint8Array(binaryStr.length);
	for (let i = 0; i < binaryStr.length; i++) {
		bytes[i] = binaryStr.charCodeAt(i);
	}
	const blob = new Blob([bytes], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	const formData = new FormData();
	formData.append("from", `Triploom <${fromEmail}>`);
	formData.append("to", to);
	formData.append("subject", subject);
	formData.append("text", description);
	formData.append("html", `<p>${description}</p>`);
	formData.append("attachments", blob, filename);

	const response = await fetch("https://smtp.maileroo.com/send", {
		method: "POST",
		headers: { "X-API-Key": apiKey },
		body: formData,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Maileroo API error: ${text}`);
	}
}
