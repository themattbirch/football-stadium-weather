class SettingsManager {
  constructor() {
    this.defaultSettings = {
      alerts: {
        highTemp: 90,
        lowTemp: 32,
        windSpeed: 20,
        rainAmount: 5,
        snowAmount: 2
      },
      display: {
        showTrends: true,
        showAlerts: true,
        temperature: 'F', // or 'C'
        refreshInterval: 30 // minutes
      }
    };
    this.loadSettings();
  }

  async loadSettings() {
    const stored = await chrome.storage.sync.get('settings');
    this.settings = stored.settings || this.defaultSettings;
  }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await chrome.storage.sync.set({ settings: this.settings });
  }

  createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.innerHTML = `
      <div class="settings-content">
        <h2>Weather Settings</h2>
        
        <div class="settings-section">
          <h3>Alert Thresholds</h3>
          <div class="setting-item">
            <label>High Temperature Alert (°F)</label>
            <input type="number" id="highTemp" value="${this.settings.alerts.highTemp}">
          </div>
          <div class="setting-item">
            <label>Low Temperature Alert (°F)</label>
            <input type="number" id="lowTemp" value="${this.settings.alerts.lowTemp}">
          </div>
          <div class="setting-item">
            <label>Wind Speed Alert (mph)</label>
            <input type="number" id="windSpeed" value="${this.settings.alerts.windSpeed}">
          </div>
        </div>

        <div class="settings-section">
          <h3>Display Options</h3>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="showTrends" 
                ${this.settings.display.showTrends ? 'checked' : ''}>
              Show Weather Trends
            </label>
          </div>
          <div class="setting-item">
            <label>Temperature Unit</label>
            <select id="tempUnit">
              <option value="F" ${this.settings.display.temperature === 'F' ? 'selected' : ''}>Fahrenheit</option>
              <option value="C" ${this.settings.display.temperature === 'C' ? 'selected' : ''}>Celsius</option>
            </select>
          </div>
        </div>

        <div class="button-group">
          <button id="saveSettings" class="primary">Save Settings</button>
          <button id="closeSettings">Cancel</button>
        </div>
      </div>
    `;

    return modal;
  }
} 