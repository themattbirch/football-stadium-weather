const API_KEY = '1ba80e3d0e80d7c84305feea8a64aa8c';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function logApiCall(type, url, status, data) {
  console.log(`API ${type}:`, {
    url: url.replace(API_KEY, 'API_KEY'),
    status,
    timestamp: new Date().toISOString(),
    data: data ? JSON.stringify(data).slice(0, 200) + '...' : null
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_WEATHER') {
    console.log('Weather request received:', {
      latitude: request.latitude,
      longitude: request.longitude,
      gameTime: request.gameTime
    });
    fetchWeatherWithRetry(request.latitude, request.longitude, request.gameTime)
      .then(data => {
        console.log('Weather response sent:', {
          hasWeather: !!data.weather,
          hasAlerts: data.alerts.length > 0,
          error: data.error || null
        });
        sendResponse(data);
      });
    return true;
  }
});

async function fetchWeatherWithRetry(lat, lon, gameTime, retryCount = 0) {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;
  const alertsUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${API_KEY}`;

  try {
    console.log(`Fetching weather data (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    const response = await fetch(weatherUrl);
    logApiCall('Weather Request', weatherUrl, response.status);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const weather = await response.json();
    logApiCall('Weather Response', weatherUrl, response.status, weather);
    
    try {
      console.log('Fetching alerts data');
      const alertsResponse = await fetch(alertsUrl);
      logApiCall('Alerts Request', alertsUrl, alertsResponse.status);
      
      if (!alertsResponse.ok) {
        throw new Error(`Alerts API error: ${alertsResponse.status}`);
      }
      
      const alertsData = await alertsResponse.json();
      logApiCall('Alerts Response', alertsUrl, alertsResponse.status, alertsData);
      
      return {
        weather: weather,
        alerts: alertsData.alerts ? alertsData.alerts.map(alert => alert.event) : []
      };
    } catch (alertError) {
      console.warn('Failed to fetch alerts:', {
        error: alertError.message,
        url: alertsUrl.replace(API_KEY, 'API_KEY')
      });
      return {
        weather: weather,
        alerts: []
      };
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry attempt ${retryCount + 1} for weather data...`, {
        error: error.message,
        nextRetryIn: RETRY_DELAY + 'ms'
      });
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWeatherWithRetry(lat, lon, gameTime, retryCount + 1);
    }
    
    console.error('Weather fetch error after retries:', {
      error: error.message,
      attempts: retryCount + 1,
      lastUrl: weatherUrl.replace(API_KEY, 'API_KEY')
    });
    return { 
      weather: null, 
      alerts: [], 
      error: `Failed after ${MAX_RETRIES} attempts: ${error.message}` 
    };
  }
} 