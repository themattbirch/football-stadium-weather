const CACHE_NAME = 'gameday-weather-v1';
const SERVER_URL = 'https://y-seven-pi.vercel.app'; // Replace with your server URL

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);

  // Handle requests to the custom server API
  if (requestURL.origin === SERVER_URL) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (!response.ok) {
            console.error('API response not ok:', response.status);
          }
          return response;
        } catch (error) {
          console.error('❌ Network error while fetching data from the server:', error);
          return new Response(
            JSON.stringify({ error: 'Network error or server unavailable' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })()
    );
  }

  // For all other requests, bypass
});

// Message listener for fetching weather data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_WEATHER') {
    console.log('🌦️ Weather request received:', {
      lat: request.latitude,
      lon: request.longitude,
    });

    fetchWeather(request.latitude, request.longitude)
      .then((data) => {
        console.log('🌤️ Weather data fetched:', data);
        sendResponse(data);
      })
      .catch((error) => {
        console.error('❌ Weather fetch error:', error);
        sendResponse({ error: error.message });
      });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

/**
 * Fetches weather data from the server API.
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @returns {Promise<Object>} - The weather data.
 */
async function fetchWeather(lat, lon) {
  const url = `${SERVER_URL}/api/weather?lat=${lat}&lon=${lon}`;
  console.log('🌍 Fetching weather from server:', url);

  try {
    const response = await fetch(url);
    console.log('📡 Server Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Weather Data:', data);
    return data;
  } catch (error) {
    console.error('❌ Fetch Weather Error:', error);
    throw error;
  }
}

// Optional: Log service worker initialization
console.log('🚀 Service Worker is active and running.');
