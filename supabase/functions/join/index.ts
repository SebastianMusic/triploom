import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req) => {
	const parsedUrl = new URL(req.url);
	const token = parsedUrl.searchParams.get("code") ?? parsedUrl.pathname.split("/").pop();

	if (!token) {
		return new Response("Not found", { status: 404 });
	}

	const deepLink = `triploom://invite?code=${token}`;

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${deepLink}" />
  <title>Join trip – Triploom</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;
    align-items:center;justify-content:center;min-height:100dvh;margin:0;
    background:#f5f5f5;color:#111;text-align:center;padding:24px}
    h1{font-size:1.4rem;margin-bottom:8px}
    p{color:#666;margin-bottom:24px}
    a{display:inline-block;background:#007aff;color:#fff;padding:14px 28px;
    border-radius:12px;text-decoration:none;font-weight:600;font-size:1rem}
  </style>
</head>
<body>
  <h1>You've been invited to a trip</h1>
  <p>Opening Triploom…</p>
  <a href="${deepLink}">Open Triploom</a>
  <script>window.location.replace("${deepLink}");</script>
</body>
</html>`;

	const headers = new Headers();
	headers.set("Content-Type", "text/html; charset=utf-8");
	headers.set("Cache-Control", "no-cache");

	return new Response(html, { status: 200, headers });
});
