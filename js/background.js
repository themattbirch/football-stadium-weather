const OPENWEATHER_API_KEY = '1ba80e3d0e80d7c84305feea8a64aa8c';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

class WeatherService {
  constructor() {
    this.cache = new Map();
  }

  async getWeather(latitude, longitude, gameTime) {
    const cacheKey = `${latitude},${longitude},${gameTime}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cachedData = this.cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.data;
      }
    }

    // Fetch new weather data
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    const data = await response.json();
    const weatherData = this.findClosestForecast(data.list, gameTime);
    
    // Cache the result
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      data: weatherData
    });

    return weatherData;
  }

  findClosestForecast(forecasts, gameTime) {
    const gameDate = new Date(gameTime);
    return forecasts.reduce((closest, current) => {
      const currentDate = new Date(current.dt * 1000);
      const currentDiff = Math.abs(currentDate - gameDate);
      const closestDiff = Math.abs(new Date(closest.dt * 1000) - gameDate);
      return currentDiff < closestDiff ? current : closest;
    });
  }

  getWeatherAlert(weather) {
    const alerts = [];
    const { temp, wind_speed, rain, snow } = weather.main;

    if (temp > 90) alerts.push('Extreme heat conditions');
    if (temp < 32) alerts.push('Freezing conditions');
    if (wind_speed > 20) alerts.push('High wind conditions');
    if (rain && rain['3h'] > 5) alerts.push('Heavy rain expected');
    if (snow && snow['3h'] > 2) alerts.push('Snow conditions');

    return alerts;
  }
}

const weatherService = new WeatherService();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_WEATHER') {
    weatherService
      .getWeather(request.latitude, request.longitude, request.gameTime)
      .then(weather => {
        const alerts = weatherService.getWeatherAlert(weather);
        sendResponse({ weather, alerts });
      });
    return true; // Required for async response
  }
}); 