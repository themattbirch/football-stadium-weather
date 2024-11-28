class GameDayWeatherUI {
  constructor() {
    console.log('Initializing GameDay Weather UI');
    this.weatherList = document.getElementById('weatherList');
    this.dateInput = document.getElementById('weather-date');
    this.nflSelect = document.getElementById('nfl-teams');
    this.collegeSelect = document.getElementById('collegeSelect');
    this.refreshButton = document.getElementById('refresh');
    this.settingsButton = document.getElementById('settings');
    
    this.settingsManager = new SettingsManager();
    
    this.initializeEventListeners();
    this.loadStadiumData();
  }

  initializeEventListeners() {
    this.refreshButton.addEventListener('click', () => this.refreshWeather());
    this.dateInput.addEventListener('change', () => this.refreshWeather());
    this.nflSelect.addEventListener('change', () => this.refreshWeather());
    this.collegeSelect.addEventListener('change', () => this.refreshWeather());
    this.settingsButton.addEventListener('click', () => this.settingsManager.openModal());

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    this.dateInput.value = today;
  }

  async loadStadiumData() {
    try {
      console.log('Loading stadium data...');
      const response = await fetch(chrome.runtime.getURL('data/stadium_coordinates.json'));
      const data = await response.json();
      console.log('Stadium data loaded:', {
        nflCount: Object.keys(data.nfl).length,
        ncaaCount: Object.keys(data.ncaa).length
      });
      this.stadiumData = data;
      this.refreshWeather();
    } catch (error) {
      console.error('Error loading stadium data:', error);
      this.weatherList.innerHTML = '<div class="error">Error loading stadium data</div>';
    }
  }

  getFilteredStadiums() {
    const selectedNFLTeam = this.nflSelect.value;
    const selectedCollege = this.collegeSelect.value;
    console.log('Filtering stadiums for:', { nfl: selectedNFLTeam, college: selectedCollege });

    let filteredStadiums = [];

    // Handle NFL selection
    if (selectedNFLTeam === 'all') {
        filteredStadiums = [...Object.entries(this.stadiumData.nfl).map(([name, info]) => ({
            name,
            ...info,
            league: 'NFL'
        }))];
    } else if (selectedNFLTeam !== 'none') {
        // Find the specific NFL stadium based on team code
        const nflStadium = Object.entries(this.stadiumData.nfl)
            .find(([_, info]) => info.team.toLowerCase().includes(selectedNFLTeam));
        if (nflStadium) {
            filteredStadiums.push({
                name: nflStadium[0],
                ...nflStadium[1],
                league: 'NFL'
            });
        }
    }

    // Handle College selection
    if (selectedCollege === 'all') {
        filteredStadiums = [...filteredStadiums, ...Object.entries(this.stadiumData.ncaa)
            .map(([name, info]) => ({
                name,
                ...info,
                league: 'NCAA'
            }))];
    } else if (selectedCollege !== 'none') {
        // Find the specific college stadium based on ID
        const collegeStadium = Object.entries(this.stadiumData.ncaa)
            .find(([_, info]) => info.id === selectedCollege);
        if (collegeStadium) {
            filteredStadiums.push({
                name: collegeStadium[0],
                ...collegeStadium[1],
                league: 'NCAA'
            });
        }
    }

    console.log(`Found ${filteredStadiums.length} matching stadiums`);
    return filteredStadiums;
  }

  async refreshWeather() {
    if (!this.stadiumData) {
      console.warn('Stadium data not loaded yet');
      return;
    }

    console.log('Refreshing weather data...');
    this.weatherList.innerHTML = '<div class="loading">Loading weather data...</div>';
    const selectedDate = this.dateInput.value || new Date().toISOString().split('T')[0];
    const stadiums = this.getFilteredStadiums();
    console.log(`Fetching weather for ${stadiums.length} stadiums`);

    const weatherPromises = stadiums.map(stadium => 
      this.fetchWeatherForStadium(stadium, selectedDate)
    );

    try {
      const weatherData = await Promise.all(weatherPromises);
      console.log('Weather data received:', {
        total: weatherData.length,
        successful: weatherData.filter(d => d.weather).length,
        failed: weatherData.filter(d => !d.weather).length
      });
      this.renderWeatherCards(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      this.weatherList.innerHTML = '<div class="error">Error fetching weather data</div>';
    }
  }

  async fetchWeatherForStadium(stadium, date) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'GET_WEATHER',
        latitude: stadium.latitude,
        longitude: stadium.longitude,
        gameTime: `${date}T${stadium.defaultGameTime || '13:00:00'}`
      }, response => {
        if (response.error) {
          console.error(`Error fetching weather for ${stadium.name}:`, response.error);
          resolve({
            stadium,
            weather: null,
            alerts: [],
            error: response.error
          });
        } else {
          resolve({
            stadium,
            weather: response.weather,
            alerts: response.alerts
          });
        }
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

  createWeatherCard({ stadium, weather, alerts, error }) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    if (error) {
      card.innerHTML = `
        <div class="game-info">
          <h3>${stadium.name}</h3>
          <div class="error">Error: ${error}</div>
        </div>`;
      return card;
    }
    
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
}

// Initialize the UI when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded, initializing UI...');
  new GameDayWeatherUI();
}); 