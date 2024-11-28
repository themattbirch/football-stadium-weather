class StadiumComparison {
  constructor(weatherService) {
    this.weatherService = weatherService;
    this.comparisonData = new Map();
  }

  async compareStadiums(stadiums, gameTime) {
    const weatherPromises = stadiums.map(stadium => 
      this.weatherService.getWeather(stadium.latitude, stadium.longitude, gameTime)
    );

    const weatherData = await Promise.all(weatherPromises);
    
    // Create comparison data structure
    stadiums.forEach((stadium, index) => {
      this.comparisonData.set(stadium.id, {
        stadium,
        weather: weatherData[index]
      });
    });

    return this.generateComparison();
  }

  generateComparison() {
    const comparison = {
      bestConditions: null,
      worstConditions: null,
      temperatureRange: {
        lowest: Infinity,
        highest: -Infinity
      },
      precipitationRisk: []
    };

    this.comparisonData.forEach(({ stadium, weather }) => {
      const temp = weather.main.temp;
      const precip = (weather.rain?.['3h'] || 0) + (weather.snow?.['3h'] || 0);

      // Update temperature range
      comparison.temperatureRange.lowest = Math.min(comparison.temperatureRange.lowest, temp);
      comparison.temperatureRange.highest = Math.max(comparison.temperatureRange.highest, temp);

      // Track precipitation risk
      if (precip > 0) {
        comparison.precipitationRisk.push({
          stadium: stadium.name,
          amount: precip,
          type: weather.snow ? 'snow' : 'rain'
        });
      }

      // Determine best/worst conditions
      const score = this.calculateConditionScore(weather);
      if (!comparison.bestConditions || score > comparison.bestConditions.score) {
        comparison.bestConditions = { stadium: stadium.name, weather, score };
      }
      if (!comparison.worstConditions || score < comparison.worstConditions.score) {
        comparison.worstConditions = { stadium: stadium.name, weather, score };
      }
    });

    return comparison;
  }

  calculateConditionScore(weather) {
    // Ideal conditions: 70°F, clear skies, light wind
    const tempScore = 100 - Math.abs(weather.main.temp - 70) * 2;
    const windScore = 100 - weather.wind.speed * 2;
    const precipScore = weather.rain || weather.snow ? 0 : 100;

    return (tempScore + windScore + precipScore) / 3;
  }

  createComparisonView() {
    const container = document.createElement('div');
    container.className = 'comparison-container';

    const comparison = this.generateComparison();
    
    container.innerHTML = `
      <div class="comparison-header">
        <h3>Stadium Weather Comparison</h3>
        <div class="temp-range">
          Temperature Range: ${Math.round(comparison.temperatureRange.lowest)}°F - 
          ${Math.round(comparison.temperatureRange.highest)}°F
        </div>
      </div>
      
      <div class="best-conditions">
        <h4>Best Playing Conditions</h4>
        <div class="stadium-name">${comparison.bestConditions.stadium}</div>
        <div class="conditions">
          ${Math.round(comparison.bestConditions.weather.main.temp)}°F, 
          ${comparison.bestConditions.weather.weather[0].description}
        </div>
      </div>

      ${comparison.precipitationRisk.length ? `
        <div class="precipitation-warning">
          <h4>Precipitation Risk</h4>
          ${comparison.precipitationRisk.map(risk => `
            <div class="risk-item">
              ${risk.stadium}: ${risk.amount}mm ${risk.type}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    return container;
  }
} 