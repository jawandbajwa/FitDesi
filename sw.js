// FitDesi Service Worker — Updated for Android Auth Fix
const CACHE_NAME = "fitdesi-v91"; // Bumped version

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

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
          ),
        ),
      ),
  );
});

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
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;

  // ─── AUTH BYPASS (THE ANDROID FIX) ──────────────────────────
  // Do NOT intercept Firebase Auth internal URLs or Google Login
  if (url.includes("/__/auth") || url.includes("accounts.google.com")) {
    return; // Let the browser handle this directly
  }

  if (!url.startsWith(self.location.origin)) return;

  const isCodeFile = /\.(js|html)(\?|$)/.test(url) || url.endsWith("/");

  if (isCodeFile) {
    const freshRequest = new Request(event.request, { cache: "reload" });
    event.respondWith(
      fetch(freshRequest)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            caches
              .open(CACHE_NAME)
              .then((cache) =>
                cache.put(event.request, networkResponse.clone()),
              );
          }
          return networkResponse;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) => cache.match(event.request)),
        ),
    );
  } else {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          return (
            cached ||
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
          );
        }),
      ),
    );
  }
});
