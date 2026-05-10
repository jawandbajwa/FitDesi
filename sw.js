// FitDesi Service Worker — Network-first, auto-update on every deploy
// Bump this version whenever you want to force a full cache wipe.
// With network-first below, normal file changes don't need a version bump.
const CACHE_NAME = "fitdesi-v65";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./coach.css",
  "./firebase.js",
  "./coach.js",
  "./coaches.js",
  "./onboarding.js",
  "./coach-config.example.js",
  "./db.js",
  "./manifest.json",
  "./tracker.html",
  "./tracker.css",
  "./tracker.js",
  "./recipes.html",
  "./recipes.css",
  "./recipes.js",
  "./exercise.html",
  "./exercise.css",
  "./exercise.js",
  "./profile.html",
  "./profile.css",
  "./admin.html",
  "./admin.css",
  "./admin.js",
  "./login.html",
  "./ingredients.js",
  "./ingredients_canada.js",
  "./recipes_canada.js",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon.ico",
];

// ─── INSTALL ─────────────────────────────────────────────────
// Skip waiting immediately so the new SW activates without needing
// all tabs closed — critical for iOS PWA which doesn't fully terminate.
self.addEventListener("install", (event) => {
  self.skipWaiting(); // take over right away, don't wait for old SW to die
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
// Delete every cache that isn't the current version, claim all
// open tabs immediately, then tell them to reload so they get
// the new files instead of the stale cached versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Tell every open tab to reload so it picks up the new files.
        // Without this, tabs keep running the old JS/CSS even after the
        // new SW activates (especially noticeable on iOS PWA).
        return self.clients.matchAll({ type: "window" }).then((clients) => {
          clients.forEach((client) => client.navigate(client.url));
        });
      })
  );
});

// ─── FETCH — Stale-While-Revalidate ──────────────────────────
// Serve from cache immediately (fast first paint), then fetch the
// network in the background and update the cache so the *next* load
// gets the freshest file.  On first visit (cache miss) we wait for
// the network.  If the network is unavailable we fall back to cache.
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests for our own origin
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        // Background revalidation — always run, regardless of cache hit
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached response instantly if available; else wait for network
        return cached || networkFetch;
      }),
    ),
  );
});
