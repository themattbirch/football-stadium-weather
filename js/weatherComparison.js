class WeatherComparison {
  constructor(historicalAnalyzer) {
    this.historicalAnalyzer = historicalAnalyzer;
    this.chartThemes = new FootballChartThemes();
  }

  async compareWithHistorical(stadium, currentWeather) {
    const historicalData = await this.historicalAnalyzer.fetchHistoricalData(stadium);
    const comparison = this.calculateComparison(currentWeather, historicalData);
    return this.createComparisonView(comparison);
  }

  calculateComparison(current, historical) {
    return {
      temperature: {
        current: current.main.temp,
        historical: historical.averageTemp,
        deviation: current.main.temp - historical.averageTemp,
        isUnusual: Math.abs(current.main.temp - historical.averageTemp) > 15
      },
      wind: {
        current: current.wind.speed,
        historical: this.calculateAverageWind(historical.windPatterns),
        deviation: current.wind.speed - this.calculateAverageWind(historical.windPatterns),
        isUnusual: this.isWindUnusual(current.wind.speed, historical.windPatterns)
      },
      conditions: {
        current: current.weather[0].main,
        typical: this.getMostCommonCondition(historical.commonConditions),
        isTypical: this.isTypicalCondition(current.weather[0].main, historical.commonConditions)
      }
    };
  }

  calculateAverageWind(windPatterns) {
    const totalOccurrences = Object.values(windPatterns).reduce((a, b) => a + b, 0);
    return (
      (windPatterns.calm * 2.5 + 
       windPatterns.moderate * 10 + 
       windPatterns.strong * 20) / totalOccurrences
    );
  }

  isWindUnusual(currentSpeed, patterns) {
    const totalPatterns = Object.values(patterns).reduce((a, b) => a + b, 0);
    if (currentSpeed < 5) {
      return (patterns.calm / totalPatterns) < 0.2;
    } else if (currentSpeed > 15) {
      return (patterns.strong / totalPatterns) < 0.2;
    }
    return false;
  }

  getMostCommonCondition(conditions) {
    return Array.from(conditions.entries())
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  isTypicalCondition(current, conditions) {
    const totalConditions = Array.from(conditions.values())
      .reduce((a, b) => a + b, 0);
    return (conditions.get(current) || 0) / totalConditions > 0.25;
  }

  createComparisonView(comparison) {
    const container = document.createElement('div');
    container.className = 'weather-comparison';

    container.innerHTML = `
      <h3>Current vs. Historical Conditions</h3>
      
      <div class="comparison-grid">
        <div class="comparison-item ${comparison.temperature.isUnusual ? 'unusual' : ''}">
          <h4>Temperature</h4>
          <div class="current-value">${Math.round(comparison.temperature.current)}°F</div>
          <div class="historical-value">
            Historical Average: ${Math.round(comparison.temperature.historical)}°F
            <span class="deviation ${comparison.temperature.deviation > 0 ? 'above' : 'below'}">
              ${Math.abs(Math.round(comparison.temperature.deviation))}°F 
              ${comparison.temperature.deviation > 0 ? 'above' : 'below'} average
            </span>
          </div>
        </div>

        <div class="comparison-item ${comparison.wind.isUnusual ? 'unusual' : ''}">
          <h4>Wind Speed</h4>
          <div class="current-value">${Math.round(comparison.wind.current)} mph</div>
          <div class="historical-value">
            Historical Average: ${Math.round(comparison.wind.historical)} mph
            <span class="deviation ${comparison.wind.deviation > 0 ? 'above' : 'below'}">
              ${Math.abs(Math.round(comparison.wind.deviation))} mph 
              ${comparison.wind.deviation > 0 ? 'above' : 'below'} average
            </span>
          </div>
        </div>

        <div class="comparison-item ${!comparison.conditions.isTypical ? 'unusual' : ''}">
          <h4>Conditions</h4>
          <div class="current-value">${comparison.conditions.current}</div>
          <div class="historical-value">
            Typical Conditions: ${comparison.conditions.typical}
            <span class="condition-note">
              ${comparison.conditions.isTypical ? 'Typical for this stadium' : 'Unusual conditions'}
            </span>
          </div>
        </div>
      </div>
    `;

    return container;
  }
} 