class FieldGoalAnalyzer {
  constructor() {
    this.windImpactFactors = {
      headwind: -0.8,    // Reduces distance
      tailwind: 0.5,     // Increases distance
      crosswind: -1.2    // Affects accuracy significantly
    };
  }

  analyzeFieldGoalConditions(weather, fieldPosition) {
    const windAnalysis = this.analyzeWindImpact(weather.wind, fieldPosition);
    const maxDistance = this.calculateMaxDistance(weather, windAnalysis);
    
    return {
      windAnalysis,
      maxDistance,
      recommendation: this.getKickingRecommendation(maxDistance, windAnalysis)
    };
  }

  analyzeWindImpact(wind, fieldPosition) {
    const windDirection = wind.deg;
    const windSpeed = wind.speed;
    
    // Convert field direction to degrees (assuming field runs north-south)
    const fieldDirection = fieldPosition.direction || 0;
    
    // Calculate relative wind angle
    const relativeAngle = Math.abs(windDirection - fieldDirection) % 360;
    
    // Determine wind type
    let windType;
    let impactFactor;
    
    if (relativeAngle <= 45 || relativeAngle >= 315) {
      windType = 'headwind';
      impactFactor = this.windImpactFactors.headwind;
    } else if (relativeAngle >= 135 && relativeAngle <= 225) {
      windType = 'tailwind';
      impactFactor = this.windImpactFactors.tailwind;
    } else {
      windType = 'crosswind';
      impactFactor = this.windImpactFactors.crosswind;
    }

    return {
      type: windType,
      speed: windSpeed,
      impact: windSpeed * impactFactor,
      direction: this.getWindDirectionDescription(relativeAngle)
    };
  }

  calculateMaxDistance(weather, windAnalysis) {
    // Base max distance in ideal conditions
    let baseDistance = 55; // yards

    // Adjust for wind
    baseDistance += windAnalysis.impact;

    // Adjust for temperature
    if (weather.main.temp < 32) {
      baseDistance -= (32 - weather.main.temp) * 0.2;
    }

    // Adjust for precipitation
    const precipitation = (weather.rain?.['1h'] || 0) + (weather.snow?.['1h'] || 0);
    if (precipitation > 0) {
      baseDistance -= precipitation * 2;
    }

    return Math.max(20, Math.round(baseDistance)); // Minimum 20 yards
  }

  getWindDirectionDescription(angle) {
    const directions = [
      'North', 'North-Northeast', 'Northeast', 'East-Northeast',
      'East', 'East-Southeast', 'Southeast', 'South-Southeast',
      'South', 'South-Southwest', 'Southwest', 'West-Southwest',
      'West', 'West-Northwest', 'Northwest', 'North-Northwest'
    ];
    const index = Math.round(angle / 22.5) % 16;
    return directions[index];
  }

  getKickingRecommendation(maxDistance, windAnalysis) {
    const recommendations = [];
    
    if (windAnalysis.type === 'crosswind' && windAnalysis.speed > 15) {
      recommendations.push({
        severity: 'high',
        message: 'Strong crosswind will significantly affect accuracy',
        adjustment: 'Aim against the wind direction'
      });
    }

    if (windAnalysis.type === 'headwind' && windAnalysis.speed > 20) {
      recommendations.push({
        severity: 'high',
        message: 'Strong headwind will reduce distance',
        adjustment: 'Reduce maximum attempt distance by 5-7 yards'
      });
    }

    if (windAnalysis.type === 'tailwind' && windAnalysis.speed > 10) {
      recommendations.push({
        severity: 'low',
        message: 'Favorable tailwind conditions',
        adjustment: 'Can attempt kicks 3-5 yards beyond normal range'
      });
    }

    return {
      maxDistance,
      recommendations,
      summary: `Maximum recommended field goal distance: ${maxDistance} yards`
    };
  }

  createWindDirectionVisualization(windAnalysis) {
    const container = document.createElement('div');
    container.className = 'wind-direction-viz';

    container.innerHTML = `
      <div class="field-overlay">
        <div class="wind-arrow" style="transform: rotate(${windAnalysis.direction}deg)">
          <div class="arrow-head"></div>
          <div class="wind-speed">${Math.round(windAnalysis.speed)} mph</div>
        </div>
        <div class="field-markings">
          <div class="goal-posts"></div>
          <div class="yard-lines"></div>
        </div>
        <div class="wind-impact">
          <span class="impact-label">${windAnalysis.type}</span>
          <span class="impact-value">${this.getImpactDescription(windAnalysis.impact)}</span>
        </div>
      </div>
    `;

    return container;
  }

  getImpactDescription(impact) {
    if (impact > 2) return 'Favorable';
    if (impact < -2) return 'Unfavorable';
    return 'Moderate';
  }
} 