class HistoricalWeatherAnalyzer {
  constructor(weatherService) {
    this.weatherService = weatherService;
    this.historicalData = new Map();
  }

  async fetchHistoricalData(stadium, years = 5) {
    const gameTime = stadium.defaultGameTime || '13:00:00';
    const currentYear = new Date().getFullYear();
    
    const historicalPromises = [];
    
    // Fetch data for the same day across multiple years
    for (let year = currentYear - years; year < currentYear; year++) {
      const date = new Date();
      date.setFullYear(year);
      
      historicalPromises.push(
        this.weatherService.getHistoricalWeather(
          stadium.latitude,
          stadium.longitude,
          `${date.toISOString().split('T')[0]}T${gameTime}`
        )
      );
    }

    const historicalWeather = await Promise.all(historicalPromises);
    this.historicalData.set(stadium.id, historicalWeather);
    
    return this.analyzeHistoricalData(stadium.id);
  }

  analyzeHistoricalData(stadiumId) {
    const data = this.historicalData.get(stadiumId);
    if (!data) return null;

    const analysis = {
      averageTemp: 0,
      tempRange: { min: Infinity, max: -Infinity },
      precipitationFrequency: 0,
      commonConditions: new Map(),
      windPatterns: {
        calm: 0,
        moderate: 0,
        strong: 0
      }
    };

    data.forEach(weather => {
      // Temperature analysis
      analysis.averageTemp += weather.main.temp;
      analysis.tempRange.min = Math.min(analysis.tempRange.min, weather.main.temp);
      analysis.tempRange.max = Math.max(analysis.tempRange.max, weather.main.temp);

      // Precipitation tracking
      if (weather.rain || weather.snow) {
        analysis.precipitationFrequency++;
      }

      // Weather conditions frequency
      const condition = weather.weather[0].main;
      analysis.commonConditions.set(
        condition,
        (analysis.commonConditions.get(condition) || 0) + 1
      );

      // Wind patterns
      const windSpeed = weather.wind.speed;
      if (windSpeed < 5) analysis.windPatterns.calm++;
      else if (windSpeed < 15) analysis.windPatterns.moderate++;
      else analysis.windPatterns.strong++;
    });

    // Calculate averages and percentages
    analysis.averageTemp /= data.length;
    analysis.precipitationFrequency = (analysis.precipitationFrequency / data.length) * 100;

    return analysis;
  }

  createHistoricalView(stadiumId) {
    const analysis = this.analyzeHistoricalData(stadiumId);
    if (!analysis) return null;

    const container = document.createElement('div');
    container.className = 'historical-analysis';
    
    container.innerHTML = `
      <h3>Historical Weather Patterns</h3>
      <div class="historical-stats">
        <div class="stat-item">
          <label>Average Temperature</label>
          <span>${Math.round(analysis.averageTemp)}°F</span>
        </div>
        <div class="stat-item">
          <label>Temperature Range</label>
          <span>${Math.round(analysis.tempRange.min)}°F - ${Math.round(analysis.tempRange.max)}°F</span>
        </div>
        <div class="stat-item">
          <label>Precipitation Chance</label>
          <span>${Math.round(analysis.precipitationFrequency)}%</span>
        </div>
      </div>
      
      <div class="wind-patterns">
        <h4>Wind Patterns</h4>
        <div class="wind-chart">
          ${Object.entries(analysis.windPatterns).map(([type, count]) => `
            <div class="wind-bar" style="height: ${(count / data.length) * 100}%">
              <span class="wind-label">${type}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return container;
  }
} 