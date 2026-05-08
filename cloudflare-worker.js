// FitDesi — Gemini Proxy Worker
// Deploy this to Cloudflare Workers, then add GEMINI_API_KEY as a secret:
//   wrangler secret put GEMINI_API_KEY
//
// The worker only accepts requests from the live site and localhost,
// so the key is never exposed to the browser.

const ALLOWED_ORIGINS = [
  "https://jawandbajwa.github.io",
  "http://localhost",
  "http://127.0.0.1",
];

const GEMINI_MODEL = "gemini-flash-latest";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.find((o) => origin.startsWith(o));

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Block non-allowed origins
    if (!allowed) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await geminiRes.json();

    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
