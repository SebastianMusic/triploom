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

function buildSpreadsheetHtml(description: string, filename: string): string {
	return `
<div style="font-family:'Roboto',Arial,sans-serif;background:#F7FBFF;padding:48px 20px;">
  <div style="max-width:460px;margin:0 auto;">

    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:26px;font-weight:900;color:#10202A;letter-spacing:-0.5px;">
        Trip<span style="color:#119FB3;">loom</span>
      </span>
    </div>

    <div style="background:#FFFFFF;border-radius:20px;padding:40px 36px;border:1px solid #D6E9F1;box-shadow:0 4px 24px rgba(16,32,42,0.08);">

      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;background:#DDF7FA;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;text-align:center;">
          📊
        </div>
      </div>

      <h1 style="font-size:22px;font-weight:900;color:#10202A;margin:0 0 10px;text-align:center;letter-spacing:-0.5px;">
        Your export is ready
      </h1>
      <p style="font-size:15px;color:#5E7282;text-align:center;margin:0 0 28px;line-height:1.65;">
        ${description}
      </p>

      <div style="background:#F7FBFF;border:1px solid #D6E9F1;border-radius:14px;padding:14px 18px;display:flex;align-items:center;margin-bottom:32px;">
        <span style="font-size:20px;margin-right:12px;">📎</span>
        <span style="font-size:14px;font-weight:700;color:#10202A;">${filename}</span>
      </div>

      <div style="border-top:1px solid #D6E9F1;margin-bottom:24px;"></div>

      <p style="font-size:13px;color:#9AB1BF;text-align:center;margin:0;line-height:1.6;">
        This export was requested from the Triploom app. If you did not request it, you can safely ignore this email.
      </p>
    </div>

    <p style="font-size:12px;color:#9AB1BF;text-align:center;margin-top:24px;">
      © 2026 Triploom &nbsp;·&nbsp;
      <a href="https://triploom.app/privacy/" style="color:#9AB1BF;text-decoration:none;">Privacy Policy</a>
    </p>

  </div>
</div>`;
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
		html: buildSpreadsheetHtml(description, filename),
		attachments: [{ blob, filename }],
	});
}
