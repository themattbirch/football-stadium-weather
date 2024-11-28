class GameDayWeatherUI {
  constructor() {
    this.weatherList = document.getElementById('weatherList');
    this.dateInput = document.getElementById('gameDate');
    this.refreshButton = document.getElementById('refresh');
    this.settingsButton = document.getElementById('settings');
    
    this.settingsManager = new SettingsManager();
    
    this.initializeEventListeners();
    this.loadStadiumData();
  }

  initializeEventListeners() {
    this.refreshButton.addEventListener('click', () => this.refreshWeather());
    this.dateInput.addEventListener('change', () => this.refreshWeather());
    this.settingsButton.addEventListener('click', () => this.openSettings());
  }

  async loadStadiumData() {
    try {
        const response = await fetch(chrome.runtime.getURL('data/stadium_coordinates.json'));
        const data = await response.json();
        
        // Combine NFL and NCAA stadiums
        this.stadiums = [
            ...Object.entries(data.nfl).map(([name, info]) => ({
                name,
                latitude: info.latitude,
                longitude: info.longitude,
                team: info.team,
                location: info.location,
                defaultGameTime: "13:00:00" // Default time for NFL games
            })),
            ...Object.entries(data.ncaa).map(([name, info]) => ({
                name,
                latitude: info.latitude,
                longitude: info.longitude,
                team: info.team,
                location: info.location,
                defaultGameTime: "13:00:00" // Default time for NCAA games
            }))
        ];
        
        this.refreshWeather();
    } catch (error) {
        console.error('Error loading stadium data:', error);
        this.weatherList.innerHTML = '<div class="error">Error loading stadium data</div>';
    }
  }

  async refreshWeather() {
    this.weatherList.innerHTML = '<div class="loading">Loading weather data...</div>';
    const selectedDate = this.dateInput.value || new Date().toISOString().split('T')[0];

    const weatherPromises = this.stadiums.map(stadium => 
      this.fetchWeatherForStadium(stadium, selectedDate)
    );

    const weatherData = await Promise.all(weatherPromises);
    this.renderWeatherCards(weatherData);
  }

  async fetchWeatherForStadium(stadium, date) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'GET_WEATHER',
        latitude: stadium.latitude,
        longitude: stadium.longitude,
        gameTime: `${date}T${stadium.defaultGameTime || '13:00:00'}`
      }, response => {
        resolve({
          stadium,
          weather: response.weather,
          alerts: response.alerts
        });
      });
    });
  }

  renderWeatherCards(weatherData) {
    this.weatherList.innerHTML = '';
    
    weatherData.forEach(data => {
      const card = this.createWeatherCard(data);
      this.weatherList.appendChild(card);
    });
  }

  createWeatherCard({ stadium, weather, alerts }) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    if (!weather || !weather.weather) {
      card.innerHTML = `
        <div class="game-info">
          <h3>${stadium.name}</h3>
          <div class="error">Weather data unavailable</div>
        </div>`;
      return card;
    }
    
    const alertsHtml = alerts && alerts.length 
      ? `<div class="alerts">${alerts.join(', ')}</div>` 
      : '';
    
    card.innerHTML = `
      <img class="weather-icon" 
           src="https://openweathermap.org/img/w/${weather.weather[0].icon}.png" 
           alt="${weather.weather[0].description}">
      <div class="game-info">
        <h3>${stadium.name}</h3>
        <div class="team">${stadium.team}</div>
        <div class="location">${stadium.location}</div>
        <div class="temperature">${Math.round(weather.main.temp)}°F</div>
        <div class="conditions">${weather.weather[0].description}</div>
        ${alertsHtml}
      </div>`;

    return card;
  }

  openSettings() {
    this.settingsManager.openModal();
  }

  async showWeatherComparison(stadium, weather) {
    const comparisonManager = new WeatherComparison(this.historicalAnalyzer);
    const comparisonView = await comparisonManager.compareWithHistorical(stadium, weather);
    
    const container = document.querySelector('.weather-container');
    const existingComparison = container.querySelector('.weather-comparison');
    
    if (existingComparison) {
      existingComparison.remove();
    }
    
    container.appendChild(comparisonView);
  }
}

// Initialize the UI when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new GameDayWeatherUI();
}); 