const CACHE_NAME = 'gameday-weather-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([
        OFFLINE_URL,
        'styles.css',
        'popup.js', // Include other essential scripts
        'data/stadium_coordinates.json',
        // Include any other assets you want cached
      ]);
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // Handle navigation requests
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  } else if (event.request.url.includes('api.openweathermap.org')) {
    // Handle API requests
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          // Return cached data if offline
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cached data, return an error response
          return new Response(JSON.stringify({ error: 'Offline and no cached data available' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
  } else {
    // For other requests, try network first, then cache
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
