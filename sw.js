// FitDesi Service Worker — Network-first, auto-update on every deploy
// Bump this version whenever you want to force a full cache wipe.
// With network-first below, normal file changes don't need a version bump.
const CACHE_NAME = "fitdesi-v70";

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
// cache: 'reload' bypasses the browser HTTP cache so we always fetch
// the latest file from the network (not a stale cached version).
self.addEventListener("install", (event) => {
  self.skipWaiting(); // take over right away, don't wait for old SW to die
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
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

// ─── FETCH — Network-first for JS/HTML, cache-first for assets ───
// JS and HTML always go to the network first so new code is never
// blocked by a stale cached version (the bug that broke recipe imports).
// Images/fonts fall back to cache when offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  const url = event.request.url;
  const isCodeFile = /\.(js|html)(\?|$)/.test(url) || url.endsWith("/");

  if (isCodeFile) {
    // Network-first: always bypass the browser HTTP cache so stale cached
    // JS/HTML never blocks freshly deployed code (cache:'reload' skips the
    // HTTP cache entirely but still updates it with the fresh response).
    const freshRequest = new Request(event.request, { cache: 'reload' });
    event.respondWith(
      fetch(freshRequest)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, networkResponse.clone())
            );
          }
          return networkResponse;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) => cache.match(event.request))
        )
    );
  } else {
    // Cache-first for images, fonts, etc. — these rarely change.
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => null);
          return cached || networkFetch;
        })
      )
    );
  }
});
