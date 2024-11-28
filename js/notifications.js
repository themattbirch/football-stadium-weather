class WeatherNotificationManager {
  constructor(alertManager) {
    this.alertManager = alertManager;
    this.notificationQueue = [];
    this.hasPermission = false;
    this.checkPermissions();
  }

  async checkPermissions() {
    if (Notification.permission === 'granted') {
      this.hasPermission = true;
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
    }
  }

  async notify(alert) {
    if (!this.hasPermission) return;

    const notification = new Notification('GameDay Weather Alert', {
      body: alert.message,
      icon: this.getWeatherIcon(alert.type),
      badge: '/icons/badge.png',
      tag: alert.id,
      requireInteraction: alert.severity === 'high',
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    notification.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'OPEN_POPUP',
        alertId: alert.id
      });
    });

    // Store in queue for popup display
    this.notificationQueue.push({
      ...alert,
      notificationId: notification.tag,
      timestamp: new Date()
    });

    // Clean up old notifications
    this.cleanupOldNotifications();
  }

  getWeatherIcon(type) {
    const icons = {
      temperature: '/icons/weather/temp.png',
      wind: '/icons/weather/wind.png',
      precipitation: '/icons/weather/rain.png'
    };
    return icons[type] || '/icons/weather/default.png';
  }

  cleanupOldNotifications() {
    const ONE_HOUR = 60 * 60 * 1000;
    this.notificationQueue = this.notificationQueue.filter(
      notification => Date.now() - notification.timestamp < ONE_HOUR
    );
  }

  createNotificationCenter() {
    const container = document.createElement('div');
    container.className = 'notification-center';
    
    if (this.notificationQueue.length === 0) {
      container.innerHTML = '<p class="no-alerts">No recent alerts</p>';
      return container;
    }

    container.innerHTML = `
      <div class="notification-header">
        <h3>Recent Alerts</h3>
        <button class="clear-all">Clear All</button>
      </div>
      <div class="notification-list">
        ${this.notificationQueue.map(notification => `
          <div class="notification-item ${notification.severity}" data-id="${notification.id}">
            <div class="notification-content">
              <img src="${this.getWeatherIcon(notification.type)}" alt="${notification.type}">
              <div class="notification-text">
                <p class="message">${notification.message}</p>
                <span class="timestamp">${this.formatTimestamp(notification.timestamp)}</span>
              </div>
            </div>
            <button class="dismiss-notification">×</button>
          </div>
        `).join('')}
      </div>
    `;

    // Add event listeners
    container.querySelector('.clear-all').addEventListener('click', () => {
      this.notificationQueue = [];
      container.querySelector('.notification-list').innerHTML = '';
    });

    container.querySelectorAll('.dismiss-notification').forEach(button => {
      button.addEventListener('click', (e) => {
        const notificationItem = e.target.closest('.notification-item');
        const notificationId = notificationItem.dataset.id;
        this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
        notificationItem.remove();
      });
    });

    return container;
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit'
    });
  }
} 