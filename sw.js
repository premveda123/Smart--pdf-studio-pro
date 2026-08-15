// Smart PDF Studio Pro — service worker
// Caches the app shell so it launches offline once installed,
// and opportunistically caches the CDN libraries after their first load.

const CACHE_NAME = "smart-pdf-studio-pro-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // cache same-origin and CDN responses (including opaque cross-origin ones)
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try { cache.put(req, copy); } catch (e) { /* ignore uncacheable responses */ }
          });
          return res;
        })
        .catch(() => cached);
    })
  );
});
