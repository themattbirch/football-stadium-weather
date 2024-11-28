export class WeatherNotificationManager {
  constructor(settings) {
    this.settings = settings;
    this.customAlerts = new Map();
  }

  createCustomAlert(condition) {
    const alert = {
      id: crypto.randomUUID(),
      ...condition,
      enabled: true,
      lastTriggered: null
    };
    this.customAlerts.set(alert.id, alert);
    return alert;
  }

  checkConditions(weatherData) {
    const alerts = [];
    const { main, wind, rain, snow } = weatherData;

    // Check each custom alert
    this.customAlerts.forEach(alert => {
      if (!alert.enabled) return;

      switch (alert.type) {
        case 'temperature':
          if (alert.operator === '>' && main.temp > alert.value) {
            alerts.push(this.formatAlert(alert, main.temp));
          } else if (alert.operator === '<' && main.temp < alert.value) {
            alerts.push(this.formatAlert(alert, main.temp));
          }
          break;

        case 'wind':
          if (wind.speed > alert.value) {
            alerts.push(this.formatAlert(alert, wind.speed));
          }
          break;

        case 'precipitation':
          const precipAmount = (rain?.['3h'] || 0) + (snow?.['3h'] || 0);
          if (precipAmount > alert.value) {
            alerts.push(this.formatAlert(alert, precipAmount));
          }
          break;
      }
    });

    return alerts;
  }

  formatAlert(alert, value) {
    return {
      id: alert.id,
      message: alert.message.replace('{value}', value),
      severity: alert.severity,
      timestamp: new Date()
    };
  }
} 