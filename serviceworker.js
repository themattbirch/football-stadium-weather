// serviceworker.js
const CACHE_NAME = 'gameday-weather-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        'styles.css',
        'popup.js',
        'data/stadium_coordinates.json'
      ]);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('api.openweathermap.org')) {
    // Handle weather API requests
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
  } else {
    // For static assets, try network first, then cache
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          return await cache.match(event.request);
        }
      })()
    );
  }
});