// index.js

import '../styles.css';
import { WeatherCard } from './components/WeatherCard';
import { PlayImpactAnalyzer } from './utils/playImpactAnalyzer';

let OPENWEATHER_API_KEY = 'ed6ef54d27fe6cc2f398a9bd585fac51'; // Replace with your actual API key

console.log('Script loading...');

function checkApiKey() {
  console.log('Checking API key:', OPENWEATHER_API_KEY);
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'ed6ef54d27fe6cc2f398a9bd585fac51') {
    console.warn('API key not configured');
    throw new Error('OpenWeather API key not configured');
  }
}

class GameDayWeather {
  constructor() {
    this.selectedStadium = 'all';
    console.log('GameDayWeather constructor called');
    this.init();
  }

  async init() {
    try {
      console.log('Initializing GameDayWeather...');

      // Load API key from localStorage if saved
      const savedApiKey = localStorage.getItem('openweatherApiKey');
      if (savedApiKey) {
        OPENWEATHER_API_KEY = savedApiKey;
        console.log('Loaded saved API key from localStorage');
      }

      // Apply dark mode preference
      const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
      if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
      }

      await this.setupComponents();
      this.setupEventListeners();
      await this.loadStadiumData();
      console.log('Initialization complete');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('Initialization Error', error.message);
    }
  }

  async setupComponents() {
    console.log('Setting up components');
    this.weatherCard = new WeatherCard();
    this.playImpactAnalyzer = new PlayImpactAnalyzer();
  }

  setupEventListeners() {
    console.log('Setting up event listeners');

    const refreshButton = document.querySelector('#refresh');
    const dateInput = document.querySelector('#weather-date');
    const settingsButton = document.querySelector('#settings');

    if (refreshButton) {
      console.log('Found refresh button');
      refreshButton.onclick = () => {
        console.log('Refresh clicked');
        this.refreshWeather();
      };
    }

    if (dateInput) {
      console.log('Found date input');
      dateInput.onchange = () => {
        console.log('Date changed');
        this.refreshWeather();
      };
    }

    if (settingsButton) {
      console.log('Found settings button');
      settingsButton.onclick = () => {
        console.log('Settings clicked');
        this.openSettings();
      };
    }

    const stadiumSelect = document.querySelector('#stadiumSelect');
    if (stadiumSelect) {
      console.log('Found stadium selector');
      stadiumSelect.onchange = () => {
        console.log('Stadium selection changed');
        this.selectedStadium = stadiumSelect.value;
        this.refreshWeather();
      };
    }
  }

  async loadStadiumData() {
    try {
      console.log('Loading stadium data...');

      const url = chrome.runtime.getURL('data/stadium_coordinates.json');
      console.log('Stadium data URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        console.error('Stadium data response not OK:', response.status);
        throw new Error('Failed to load stadium data');
      }

      const data = await response.json();
      console.log('Raw stadium data:', data);

      if (!data.nfl || !data.ncaa) {
        console.error('Invalid stadium data format:', data);
        throw new Error('Invalid stadium data format');
      }

      // Combine NFL and NCAA stadiums
      this.stadiums = [
        ...Object.values(data.nfl),
        ...Object.values(data.ncaa),
      ];
      this.populateStadiumSelector();
      console.log('Loaded stadiums:', this.stadiums);
    } catch (error) {
      console.error('Error loading stadium data:', error);
      this.showError('Could not load stadium data', 'Please check your connection and try again');
    }
  }

  populateStadiumSelector() {
    const selector = document.querySelector('#stadiumSelect');
    if (!selector) return;

    selector.innerHTML = `
      <option value="all">All Stadiums</option>
      ${this.stadiums.map(stadium => `
        <option value="${stadium.team}">${stadium.name} - ${stadium.team}</option>
      `).join('')}
    `;
  }

  async refreshWeather() {
    console.log('Refreshing weather data');
    const weatherList = document.getElementById('weatherList');
    if (!weatherList) {
      console.error('Weather list element not found');
      return;
    }
    console.log('Setting loading state');
    weatherList.innerHTML = '<div class="loading">Loading weather data...</div>';

    const dateInput = document.getElementById('weather-date');
    if (!dateInput) {
      console.error('Date input not found');
      return;
    }
    const selectedDate = dateInput.value || new Date().toISOString().split('T')[0];
    console.log('Selected date:', selectedDate);

    try {
      console.log('Stadiums data:', this.stadiums);
      if (!this.stadiums) {
        throw new Error('No stadium data available');
      }

      let stadiumsToFetch = this.stadiums;
      if (this.selectedStadium && this.selectedStadium !== 'all') {
        stadiumsToFetch = this.stadiums.filter(s => s.team === this.selectedStadium);
      }

      console.log('Fetching weather for stadiums:', stadiumsToFetch);
      const weatherPromises = stadiumsToFetch.map(stadium =>
        this.fetchWeatherForStadium(stadium, selectedDate)
      );

      const weatherData = await Promise.all(weatherPromises);
      console.log('Weather data received:', weatherData);
      this.displayWeather(weatherData);
    } catch (error) {
      console.error('Error in refreshWeather:', error);
      this.showError('Could not fetch weather data');
    }
  }

  async fetchWeatherForStadium(stadium, date) {
    checkApiKey();

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${stadium.latitude}&lon=${stadium.longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const weather = await response.json();
      return { stadium, weather };
    } catch (error) {
      console.error(`Error fetching weather for ${stadium.name}:`, error);
      throw error;
    }
  }

  displayWeather(weatherData) {
    console.log('Displaying weather data:', weatherData);
    const weatherList = document.getElementById('weatherList');
    if (!weatherList) {
      console.error('Weather list element not found in displayWeather');
      return;
    }
    weatherList.innerHTML = '';

    weatherData.forEach((data, index) => {
      console.log(`Creating weather card ${index + 1}:`, data);
      const cardElement = this.weatherCard.createCard(data.weather, data.stadium);
      weatherList.appendChild(cardElement);
    });
  }

  showError(title, message, isApiError = false) {
    console.log('Showing error:', { title, message, isApiError });
    const weatherList = document.getElementById('weatherList');
    if (!weatherList) {
      console.error('Weather list element not found in showError');
      return;
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = `error-message ${isApiError ? 'api-key-missing' : ''}`;

    const titleElement = document.createElement('strong');
    titleElement.textContent = title;
    errorDiv.appendChild(titleElement);

    if (message) {
      const messageP = document.createElement('p');
      messageP.textContent = message;
      errorDiv.appendChild(messageP);
    }

    const button = document.createElement('button');
    button.textContent = isApiError ? 'Configure API Key' : 'Try Again';
    button.addEventListener('click', () => {
      if (isApiError) {
        this.openSettings();
      } else {
        window.location.reload();
      }
    });
    errorDiv.appendChild(button);

    weatherList.innerHTML = '';
    weatherList.appendChild(errorDiv);
  }

  openSettings() {
    // Adjusted to not use chrome.storage and handle settings locally
    const modal = document.createElement('div');
    modal.className = 'settings-modal';

    // Load settings from localStorage
    const settings = JSON.parse(localStorage.getItem('settings')) || {};

    modal.innerHTML = `
      <div class="settings-content">
        <h2>Settings</h2>
        <div class="settings-section">
          <div class="setting-item">
            <label for="apiKey">OpenWeather API Key</label>
            <input type="text" id="apiKey" placeholder="Enter API Key" value="${OPENWEATHER_API_KEY !== 'ed6ef54d27fe6cc2f398a9bd585fac51' ? OPENWEATHER_API_KEY : ''}" />
          </div>
          <div class="setting-item">
            <label>
              <input type="checkbox" id="darkMode" ${document.body.classList.contains('dark-mode') ? 'checked' : ''}>
              Enable Dark Mode
            </label>
          </div>
        </div>
        <div class="settings-footer">
          <button class="cancel-btn">Cancel</button>
          <button class="save-btn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners for buttons
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    saveBtn.addEventListener('click', () => {
      console.log('💾 Saving settings');
      const apiKey = modal.querySelector('#apiKey').value.trim();
      const darkModeEnabled = modal.querySelector('#darkMode').checked;

      if (apiKey) {
        OPENWEATHER_API_KEY = apiKey;
        localStorage.setItem('openweatherApiKey', apiKey);
        console.log('API Key saved to localStorage');
        this.refreshWeather();
      }

      if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }

      // Save dark mode preference to localStorage
      localStorage.setItem('darkModeEnabled', darkModeEnabled);

      // Close the modal
      closeModal();
    });

    cancelBtn.addEventListener('click', () => {
      console.log('❌ Cancel settings');
      closeModal();
    });

    // Close modal when clicking outside of it
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  async testWeatherAPI() {
    try {
      // Test with one stadium first
      if (!this.stadiums || this.stadiums.length === 0) {
        await this.loadStadiumData();
      }
      const testStadium = this.stadiums[0];
      const result = await this.fetchWeatherForStadium(testStadium, new Date().toISOString().split('T')[0]);
      console.log('API Test Result:', result);
      return true;
    } catch (error) {
      if (error.message.includes('API key not configured')) {
        this.showError(
          'API Key Required',
          'Please configure your OpenWeather API key in settings',
          true
        );
      } else {
        this.showError(
          'Weather API Error',
          'Could not connect to weather service. Please try again later.'
        );
      }
      return false;
    }
  }

  applySettings(settings) {
    this.settings = settings;

    document.querySelectorAll('.temperature').forEach(el => {
      const temp = parseFloat(el.textContent);
      el.textContent = settings.temperature === 'C' ?
        `${this.convertToC(temp)}°C` :
        `${temp}°F`;
    });

    if (!settings.showFeelsLike) {
      document.querySelectorAll('.feels-like').forEach(el => el.style.display = 'none');
    }
  }

  convertToC(fahrenheit) {
    return Math.round((fahrenheit - 32) * 5 / 9);
  }
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Creating GameDayWeather instance');
    window.gameWeather = new GameDayWeather();
  });
} else {
  console.log('DOM already loaded - Creating GameDayWeather instance');
  window.gameWeather = new GameDayWeather();
}
