// FitDesi — Gemini Proxy Worker
//
// Key split:
//   GEMINI_API_KEY_ADMIN  → dedicated to admin only (never shared)
//   GEMINI_API_KEY_1..4   → shared across all other users, round-robin + fallback
//
// Add secrets:
//   wrangler secret put GEMINI_API_KEY_ADMIN
//   wrangler secret put GEMINI_API_KEY_1
//   wrangler secret put GEMINI_API_KEY_2
//   wrangler secret put GEMINI_API_KEY_3
//   wrangler secret put GEMINI_API_KEY_4

const ALLOWED_ORIGINS = [
  "https://jawandbajwa.github.io",
  "http://localhost",
  "http://127.0.0.1",
];

const GEMINI_MODEL = "gemini-flash-latest";

async function callGemini(keys, body, startIndex = 0) {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[(startIndex + i) % keys.length];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (res.status === 429) continue; // rate limited — try next key

    return res;
  }
  return null; // all keys rate-limited
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = ALLOWED_ORIGINS.find((o) => origin.startsWith(o));

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Is-Admin",
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

    const isAdmin = request.headers.get("X-Is-Admin") === "true";

    let geminiRes;

    if (isAdmin) {
      // Admin gets their own dedicated key
      const adminKey = env.GEMINI_API_KEY_ADMIN;
      if (!adminKey) {
        return new Response(
          JSON.stringify({ error: { message: "Admin API key not configured" } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${adminKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
    } else {
      // Family users share 4 keys with round-robin + fallback
      const userKeys = [
        env.GEMINI_API_KEY_1,
        env.GEMINI_API_KEY_2,
        env.GEMINI_API_KEY_3,
        env.GEMINI_API_KEY_4,
      ].filter(Boolean);

      if (!userKeys.length) {
        return new Response(
          JSON.stringify({ error: { message: "No user API keys configured" } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const startIndex = Math.floor(Date.now() / 1000) % userKeys.length;
      geminiRes = await callGemini(userKeys, body, startIndex);

      if (!geminiRes) {
        return new Response(
          JSON.stringify({ error: { message: "All keys are rate-limited. Try again in a minute." } }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const data = await geminiRes.json();
    return new Response(JSON.stringify(data), {
      status: geminiRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
