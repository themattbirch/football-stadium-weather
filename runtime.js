// runtime.js
console.log('Runtime script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_MESSAGE') {
    console.log('Log from content script:', message.content);
  }

  if (message.type === 'FETCH_WEATHER') {
    const { lat, lon } = message;
    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);
    fetchWeather(lat, lon).then(sendResponse).catch(sendResponse);
    return true; // Keeps the message channel open
  }
});

async function fetchWeather(lat, lon) {
  const url = `https://y-seven-pi.vercel.app/api/weather?lat=${lat}&lon=${lon}`;
  console.log('Fetching weather from:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}
