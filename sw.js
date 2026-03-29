const CACHE_NAME = "practice-english-v1";

const BASE = "/practice-english";

const PRECACHE_URLS = [
  BASE + "/index.html",
  BASE + "/css/style.css",
  BASE + "/js/app.js",
  BASE + "/manifest.json",
  BASE + "/images/modules/vocabulary.webp",
  BASE + "/images/modules/grammar.webp",
  BASE + "/images/modules/spelling.webp",
  BASE + "/images/modules/reading.webp",
  BASE + "/images/modules/listening.webp",
  BASE + "/images/modules/tests.webp",
];

// Install — precache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === "GET" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
