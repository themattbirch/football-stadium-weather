// background.js

const API_KEY = '1ba80e3d0e80d7c84305feea8a64aa8c';

const CACHE_NAME = 'gameday-weather-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Immediately activate the service worker without waiting
  event.waitUntil(self.skipWaiting());
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Claim clients immediately so that the service worker starts controlling them
  event.waitUntil(self.clients.claim());
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const requestURL = new URL(event.request.url);

  // Handle requests to the OpenWeather API
  if (requestURL.origin === 'https://api.openweathermap.org') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          // Optionally, cache the response here if you want to store API responses
          // const cache = await caches.open(CACHE_NAME);
          // cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          console.error('❌ Network error while fetching weather data:', error);
          // Return a fallback response if desired
          return new Response(JSON.stringify({ error: 'Network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
  }

  // For all other requests, do not interfere
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
 * Fetches weather data from the OpenWeather API.
 * @param {number} lat - Latitude of the location.
 * @param {number} lon - Longitude of the location.
 * @returns {Promise<Object>} - The weather data.
 */
async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
  console.log('🌍 Fetching weather from:', url);

  const response = await fetch(url);
  console.log('📡 API Response Status:', response.status);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('📦 Raw API Response:', data);
  return data;
}

// Initial API key test
(async function testAPIKey() {
  try {
    // Test with Lambeau Field coordinates
    const testURL = `https://api.openweathermap.org/data/2.5/weather?lat=44.5013&lon=-88.0622&units=imperial&appid=${API_KEY}`;
    console.log('Testing API with URL:', testURL);

    const response = await fetch(testURL);
    console.log('API Test Response Status:', response.status);

    const data = await response.json();
    console.log('API Test Data:', data);

    if (data.cod === 200) {
      console.log('✅ API Key is working');
    } else {
      console.error('❌ API Key test failed:', data.message);
    }
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
})();
