const CACHE_NAME = 'lifealigner-v1';
const OFFLINE_URL = '/daily';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/daily',
  '/manifest.json',
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  // Skip Supabase API calls (let them fail naturally when offline)
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful HTML/JS/CSS responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, serve the daily page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync (future: queue activity logs when offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-activity-logs') {
    // Placeholder for future write queue
    console.log('[SW] Background sync triggered');
  }
});
