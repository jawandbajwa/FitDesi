// FitDesi Service Worker — Network-first, auto-update on every deploy
// Bump this version whenever you want to force a full cache wipe.
// With network-first below, normal file changes don't need a version bump.
const CACHE_NAME = "fitdesi-v32";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
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
// Cache files individually so one missing file doesn't break the entire SW.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting()),
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────
// Delete every cache that isn't the current version, then
// immediately take control of all open tabs (clients.claim).
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
      .then(() => self.clients.claim()), // ← control open tabs immediately
  );
});

// ─── FETCH — Network First, Cache Fallback ───────────────────
// Always try the network. On success, refresh the cache entry so
// next offline visit gets the latest file. On failure, serve cache.
// This guarantees deployed changes are visible on the next page load
// without the user needing to delete and recreate the bookmark.
self.addEventListener("fetch", (event) => {
  // Only intercept GET requests for our own origin
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Fresh from network — update the cache entry
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() =>
        // Network unavailable — serve from cache (offline support)
        caches.match(event.request),
      ),
  );
});
