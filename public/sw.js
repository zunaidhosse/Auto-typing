// Basic service worker for PWA support
const CACHE_NAME = 'notetype-v1';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // @ts-ignore
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
