// FitDesi — Gemini Proxy Worker
// Round-robin across all available keys + automatic fallback if one hits rate limit.
//
// Add keys as secrets (existing key becomes key 1):
//   wrangler secret put GEMINI_API_KEY_1
//   wrangler secret put GEMINI_API_KEY_2
//   wrangler secret put GEMINI_API_KEY_3
//   wrangler secret put GEMINI_API_KEY_4
//   wrangler secret put GEMINI_API_KEY_5
//
// You can add fewer than 5 — the worker uses however many are configured.

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

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

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

    // Build list of available keys from secrets
    const keys = [
      env.GEMINI_API_KEY_1,
      env.GEMINI_API_KEY_2,
      env.GEMINI_API_KEY_3,
      env.GEMINI_API_KEY_4,
      env.GEMINI_API_KEY_5,
    ].filter(Boolean);

    if (!keys.length) {
      return new Response(JSON.stringify({ error: { message: "No API keys configured" } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Round-robin: pick starting key based on current second so load
    // spreads evenly over time across all keys.
    const startIndex = Math.floor(Date.now() / 1000) % keys.length;

    // Try each key starting from startIndex, wrapping around.
    // On 429 (rate limit) move to the next key automatically.
    for (let i = 0; i < keys.length; i++) {
      const key = keys[(startIndex + i) % keys.length];

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      // On rate limit, try the next key
      if (geminiRes.status === 429) continue;

      const data = await geminiRes.json();
      return new Response(JSON.stringify(data), {
        status: geminiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All keys rate-limited
    return new Response(
      JSON.stringify({ error: { message: "All API keys are currently rate-limited. Try again in a minute." } }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  },
};
