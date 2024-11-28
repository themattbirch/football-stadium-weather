const CACHE_NAME = 'gameday-weather-v1';
const OFFLINE_URL = 'offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      
      // Cache stadium coordinates
      await cache.add('data/stadium_coordinates.json');
      
      // Cache weather icons
      const weatherIcons = [
        'clear.png', 'clouds.png', 'rain.png', 'snow.png'
      ];
      await Promise.all(
        weatherIcons.map(icon => 
          cache.add(`icons/weather/${icon}`)
        )
      );
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // First, try to use the navigation preload response if it's supported
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

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
    event.respondWith(
      (async () => {
        try {
          // Try network first for weather data
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          // If offline, return cached weather data
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })()
    );
  }
}); 