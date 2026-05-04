const FROM_EMAIL =
	Deno.env.get("MAILEROO_FROM_EMAIL") ?? "mail@noreply.triploom.app";

export interface EmailAttachment {
	blob: Blob;
	filename: string;
}

export interface SendEmailParams {
	to: string;
	subject: string;
	text: string;
	html?: string;
	attachments?: EmailAttachment[];
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
	const apiKey = Deno.env.get("MAILEROO_API_KEY");
	if (!apiKey) throw new Error("MAILEROO_API_KEY is not set");

	const { to, subject, text, html, attachments } = params;

	const formData = new FormData();
	formData.append("from", `Triploom <${FROM_EMAIL}>`);
	formData.append("to", to);
	formData.append("subject", subject);
	formData.append("text", text);
	formData.append("html", html ?? `<p>${text}</p>`);

	for (const { blob, filename } of attachments ?? []) {
		formData.append("attachments", blob, filename);
	}

	const response = await fetch("https://smtp.maileroo.com/send", {
		method: "POST",
		headers: { "X-API-Key": apiKey },
		body: formData,
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Maileroo API error: ${body}`);
	}
}

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
	const { to, subject, description, spreadsheetBase64, filename } = params;

	const binaryStr = atob(spreadsheetBase64);
	const bytes = new Uint8Array(binaryStr.length);
	for (let i = 0; i < binaryStr.length; i++) {
		bytes[i] = binaryStr.charCodeAt(i);
	}
	const blob = new Blob([bytes], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});

	await sendEmail({
		to,
		subject,
		text: description,
		attachments: [{ blob, filename }],
	});
}
