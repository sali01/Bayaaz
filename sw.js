const CACHE_NAME = 'noha-bayaz-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@panzoom/panzoom@4.5.1/dist/panzoom.min.js'
];

// 1. Install Event - Cache the Shell UI Application Layout
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching App Shell Architecture...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - Intercepts requests to cache cloud images dynamically on the fly
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy: Cache First, fallback to Network for remote images (Firebase Storage URLs / Picsum placeholders)
  if (requestUrl.href.includes('firebaseapp.com') || requestUrl.href.includes('firebasestorage.googleapis.com') || requestUrl.href.includes('picsum.photos')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return from local storage instantly if found
            return cachedResponse;
          }
          // Otherwise fetch from live database, clone it into cache repository, and return
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Silent fallback if image fetch fails entirely offline
            return new Response('Image Unavailable Offline', { status: 503 });
          });
        });
      })
    );
    return;
  }

  // Standard Network-First Strategy for internal app shell files
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});