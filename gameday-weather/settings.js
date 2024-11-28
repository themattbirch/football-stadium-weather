class SettingsManager {
  constructor() {
    this.modal = null;
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

  openModal() {
    if (this.modal) this.closeModal();
    this.modal = this.createSettingsModal();
    document.body.appendChild(this.modal);
    
    // Add event listeners
    const saveBtn = this.modal.querySelector('#saveSettings');
    const closeBtn = this.modal.querySelector('#closeSettings');
    
    saveBtn.addEventListener('click', () => this.saveAndClose());
    closeBtn.addEventListener('click', () => this.closeModal());
    
    // Close when clicking outside the modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });
  }

  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  saveAndClose() {
    const newSettings = {
      alerts: {
        highTemp: parseInt(this.modal.querySelector('#highTemp').value),
        lowTemp: parseInt(this.modal.querySelector('#lowTemp').value),
        windSpeed: parseInt(this.modal.querySelector('#windSpeed').value),
        rainAmount: this.settings.alerts.rainAmount,
        snowAmount: this.settings.alerts.snowAmount
      },
      display: {
        showTrends: this.modal.querySelector('#showTrends').checked,
        showAlerts: this.settings.display.showAlerts,
        temperature: this.modal.querySelector('#tempUnit').value,
        refreshInterval: this.settings.display.refreshInterval
      }
    };
    
    this.saveSettings(newSettings);
    this.closeModal();
    window.dispatchEvent(new Event('settingsChanged'));
  }
} 