export class WeatherPushNotifications {
  constructor(weatherService) {
    this.weatherService = weatherService;
    this.lastConditions = new Map();
    this.thresholds = {
      temperature: 5,  // °F change
      windSpeed: 5,    // mph change
      precipitation: 0.1 // inches change
    };
  }

  async initializePushManager() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('serviceWorker.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        return subscription;
      } catch (error) {
        console.error('Push subscription failed:', error);
        return null;
      }
    }
  }

  async checkWeatherChanges(stadium) {
    const currentWeather = await this.weatherService.getWeather(
      stadium.latitude,
      stadium.longitude,
      new Date()
    );

    const lastWeather = this.lastConditions.get(stadium.id);
    if (!lastWeather) {
      this.lastConditions.set(stadium.id, currentWeather);
      return;
    }

    const changes = this.detectSignificantChanges(lastWeather, currentWeather);
    if (changes.length > 0) {
      this.sendPushNotification(stadium, changes);
      this.lastConditions.set(stadium.id, currentWeather);
    }
  }

  detectSignificantChanges(oldWeather, newWeather) {
    const changes = [];

    // Check temperature change
    const tempDiff = Math.abs(newWeather.main.temp - oldWeather.main.temp);
    if (tempDiff >= this.thresholds.temperature) {
      changes.push({
        type: 'temperature',
        message: `Temperature ${newWeather.main.temp > oldWeather.main.temp ? 'increased' : 'decreased'} by ${Math.round(tempDiff)}°F`,
        severity: tempDiff >= this.thresholds.temperature * 2 ? 'high' : 'medium'
      });
    }

    // Check wind change
    const windDiff = Math.abs(newWeather.wind.speed - oldWeather.wind.speed);
    if (windDiff >= this.thresholds.windSpeed) {
      changes.push({
        type: 'wind',
        message: `Wind speed ${newWeather.wind.speed > oldWeather.wind.speed ? 'increased' : 'decreased'} by ${Math.round(windDiff)} mph`,
        severity: windDiff >= this.thresholds.windSpeed * 2 ? 'high' : 'medium'
      });
    }

    // Check precipitation change
    const oldPrecip = (oldWeather.rain?.['1h'] || 0) + (oldWeather.snow?.['1h'] || 0);
    const newPrecip = (newWeather.rain?.['1h'] || 0) + (newWeather.snow?.['1h'] || 0);
    const precipDiff = Math.abs(newPrecip - oldPrecip);
    
    if (precipDiff >= this.thresholds.precipitation) {
      changes.push({
        type: 'precipitation',
        message: `Precipitation ${newPrecip > oldPrecip ? 'increased' : 'decreased'} by ${precipDiff.toFixed(2)} inches`,
        severity: precipDiff >= this.thresholds.precipitation * 2 ? 'high' : 'medium'
      });
    }

    return changes;
  }

  async sendPushNotification(stadium, changes) {
    const notification = {
      title: `Weather Update for ${stadium.name}`,
      body: changes.map(change => change.message).join('\n'),
      icon: '/icons/weather/alert.png',
      badge: '/icons/badge.png',
      data: {
        stadiumId: stadium.id,
        timestamp: new Date().toISOString(),
        changes
      }
    };

    if (this.pushSubscription) {
      await fetch('/api/push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: this.pushSubscription,
          notification
        })
      });
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
} 