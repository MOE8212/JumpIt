// JumpIt Service Worker - PWA Support
const CACHE_NAME = 'jumpit-v4';
const urlsToCache = [
  '/JumpIt/',
  '/JumpIt/index.html',
  '/JumpIt/game.js',
  '/JumpIt/auth-supabase.js',
  '/JumpIt/admin-supabase.js',
  '/JumpIt/api-client-supabase.js',
  '/JumpIt/supabase-config.js',
  '/JumpIt/styles.css',
  '/JumpIt/manifest.json',
  'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        // Use addAll with individual error handling
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Service Worker: Failed to cache:', url, err);
              return null; // Continue even if one fails
            });
          })
        );
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch - Network first, fallback to cache (mit besserer Error-Behandlung)
self.addEventListener('fetch', event => {
  // Skip chrome extension and non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // WICHTIG: Supabase API-Calls NIEMALS cachen!
  // Diese müssen immer live vom Server kommen
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  // Only GET requests can be cached
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful GET responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(error => {
        console.log('Service Worker: Fetch failed, trying cache:', event.request.url);
        // If network fails, try cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache either, return a basic response
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
      })
  );
});

