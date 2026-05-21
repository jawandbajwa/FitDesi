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
//
// Rate limiting (v2):
//   Per-IP sliding window via Workers KV. Limits a single user/IP from
//   draining the shared Gemini quota or running up cost in a runaway tab.
//
//   Requires a KV namespace binding called `RATE_LIMIT`. Set up via:
//     1. Cloudflare dashboard → Workers → KV → Create namespace "fitdesi-rate-limit"
//     2. wrangler.toml:
//          [[kv_namespaces]]
//          binding = "RATE_LIMIT"
//          id = "<the-id-cloudflare-gave-you>"
//     3. wrangler deploy
//
//   If the binding is missing, the worker still works — rate limiting just
//   no-ops (logs a warning). So setup is non-breaking.

const ALLOWED_ORIGINS = [
  "https://jawandbajwa.github.io",
  "http://localhost",
  "http://127.0.0.1",
];

const GEMINI_MODEL = "gemini-flash-latest";

// Rate-limit policy. Tune these as you grow.
const RATE_LIMITS = {
  user:  { perMinute: 30,  perHour: 200  }, // family users
  admin: { perMinute: 100, perHour: 1000 }, // admin (you)
};

/**
 * Sliding-window rate check. Stores 2 counters per identity (minute + hour)
 * in Workers KV with self-expiring TTLs. Returns { allowed, retryAfter }.
 */
async function checkRateLimit(kv, identity, limits) {
  if (!kv) return { allowed: true }; // no KV binding → skip
  const now = Date.now();
  const minuteBucket = Math.floor(now / 60000);
  const hourBucket = Math.floor(now / 3600000);
  const mKey = `rl:m:${identity}:${minuteBucket}`;
  const hKey = `rl:h:${identity}:${hourBucket}`;

  // KV read is eventually consistent — for rate limiting that's fine,
  // a few extra requests over the limit are acceptable.
  const [mCountRaw, hCountRaw] = await Promise.all([
    kv.get(mKey),
    kv.get(hKey),
  ]);
  const mCount = parseInt(mCountRaw || "0", 10);
  const hCount = parseInt(hCountRaw || "0", 10);

  if (mCount >= limits.perMinute) {
    return { allowed: false, retryAfter: 60 - Math.floor((now % 60000) / 1000) };
  }
  if (hCount >= limits.perHour) {
    return { allowed: false, retryAfter: 3600 - Math.floor((now % 3600000) / 1000) };
  }

  // Increment both counters (fire-and-forget; TTL slightly longer than window)
  kv.put(mKey, String(mCount + 1), { expirationTtl: 70 }).catch(() => {});
  kv.put(hKey, String(hCount + 1), { expirationTtl: 3700 }).catch(() => {});

  return { allowed: true };
}

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
      "Access-Control-Allow-Headers": "Content-Type, X-Is-Admin, X-User-Uid",
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

    // ── Rate limiting ─────────────────────────────────────────
    // Identify by user UID if provided, otherwise fall back to client IP.
    // UID is more accurate for shared-network families. IP is the fallback.
    const isAdmin = request.headers.get("X-Is-Admin") === "true";
    const uid = request.headers.get("X-User-Uid") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const identity = uid ? `u:${uid}` : `ip:${ip}`;
    const limits = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.user;

    const rateCheck = await checkRateLimit(env.RATE_LIMIT, identity, limits);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Rate limit exceeded. Slow down and try again in a moment.",
            retryAfter: rateCheck.retryAfter,
          },
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter),
          },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

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
