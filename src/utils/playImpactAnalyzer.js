import { FieldGoalAnalyzer } from './fieldGoalAnalyzer';

export class PlayImpactAnalyzer {
  constructor() {
    this.impactThresholds = {
      passing: {
        wind: {
          low: 10,    // mph
          high: 20    // mph
        },
        precipitation: {
          low: 0.1,   // inches/hour
          high: 0.5   // inches/hour
        },
        temperature: {
          low: 32,    // °F
          high: 90    // °F
        }
      },
      running: {
        precipitation: {
          low: 0.25,  // inches/hour
          high: 1.0   // inches/hour
        },
        temperature: {
          low: 20,    // °F
          high: 95    // °F
        }
      },
      kicking: {
        wind: {
          low: 15,    // mph
          high: 25    // mph
        },
        precipitation: {
          low: 0.2,   // inches/hour
          high: 0.75  // inches/hour
        },
        temperature: {
          low: 25,    // °F
          high: 95    // °F
        }
      }
    };
    this.fieldGoalAnalyzer = new FieldGoalAnalyzer();
  }

  calculatePlayImpacts(weather) {
    return {
      passing: this.analyzePassingImpact(weather),
      running: this.analyzeRunningImpact(weather),
      kicking: this.analyzeKickingImpact(weather)
    };
  }

  analyzePassingImpact(weather) {
    const impacts = [];
    let totalImpact = 0;

    // Wind impact
    if (weather.wind.speed >= this.impactThresholds.passing.wind.high) {
      impacts.push({
        factor: 'wind',
        severity: 'high',
        description: 'Strong winds will significantly affect passing accuracy',
        impact: -3
      });
      totalImpact -= 3;
    } else if (weather.wind.speed >= this.impactThresholds.passing.wind.low) {
      impacts.push({
        factor: 'wind',
        severity: 'medium',
        description: 'Moderate winds may affect deep passes',
        impact: -1
      });
      totalImpact -= 1;
    }

    // Precipitation impact
    const precipRate = (weather.rain?.['1h'] || 0) + (weather.snow?.['1h'] || 0);
    if (precipRate >= this.impactThresholds.passing.precipitation.high) {
      impacts.push({
        factor: 'precipitation',
        severity: 'high',
        description: 'Heavy precipitation will make ball handling difficult',
        impact: -3
      });
      totalImpact -= 3;
    } else if (precipRate >= this.impactThresholds.passing.precipitation.low) {
      impacts.push({
        factor: 'precipitation',
        severity: 'medium',
        description: 'Light precipitation may affect grip',
        impact: -1
      });
      totalImpact -= 1;
    }

    // Temperature impact
    if (weather.main.temp <= this.impactThresholds.passing.temperature.low) {
      impacts.push({
        factor: 'temperature',
        severity: 'high',
        description: 'Cold temperatures will affect ball grip and throwing',
        impact: -2
      });
      totalImpact -= 2;
    } else if (weather.main.temp >= this.impactThresholds.passing.temperature.high) {
      impacts.push({
        factor: 'temperature',
        severity: 'medium',
        description: 'High temperatures may affect player stamina',
        impact: -1
      });
      totalImpact -= 1;
    }

    return {
      impacts,
      totalImpact,
      recommendation: this.getPlayRecommendation('passing', totalImpact)
    };
  }

  analyzeRunningImpact(weather) {
    const impacts = [];
    let totalImpact = 0;

    // Precipitation impact on running
    const precipRate = (weather.rain?.['1h'] || 0) + (weather.snow?.['1h'] || 0);
    if (precipRate >= this.impactThresholds.running.precipitation.high) {
      impacts.push({
        factor: 'precipitation',
        severity: 'high',
        description: 'Slippery conditions will affect cutting and acceleration',
        impact: -2
      });
      totalImpact -= 2;
    } else if (precipRate >= this.impactThresholds.running.precipitation.low) {
      impacts.push({
        factor: 'precipitation',
        severity: 'low',
        description: 'Slightly slick conditions may affect quick changes in direction',
        impact: -1
      });
      totalImpact -= 1;
    }

    // Temperature impact on running
    if (weather.main.temp <= this.impactThresholds.running.temperature.low) {
      impacts.push({
        factor: 'temperature',
        severity: 'medium',
        description: 'Cold temperatures may affect muscle performance',
        impact: -2
      });
      totalImpact -= 2;
    } else if (weather.main.temp >= this.impactThresholds.running.temperature.high) {
      impacts.push({
        factor: 'temperature',
        severity: 'high',
        description: 'High temperatures will affect player endurance',
        impact: -2
      });
      totalImpact -= 2;
    }

    return {
      impacts,
      totalImpact,
      recommendation: this.getPlayRecommendation('running', totalImpact)
    };
  }

  analyzeKickingImpact(weather) {
    const basicImpact = this.analyzeBasicKickingImpact(weather);
    const fieldGoalAnalysis = this.fieldGoalAnalyzer.analyzeFieldGoalConditions(weather, {
      direction: 0 // Default to north-south field orientation
    });

    return {
      ...basicImpact,
      fieldGoal: fieldGoalAnalysis,
      windVisualization: this.fieldGoalAnalyzer.createWindDirectionVisualization(
        fieldGoalAnalysis.windAnalysis
      )
    };
  }

  analyzeBasicKickingImpact(weather) {
    const impacts = [];
    let totalImpact = 0;

    // Wind impact on kicking
    if (weather.wind.speed >= this.impactThresholds.kicking.wind.high) {
      impacts.push({
        factor: 'wind',
        severity: 'high',
        description: 'Strong winds will significantly affect kick accuracy and distance',
        impact: -3
      });
      totalImpact -= 3;
    } else if (weather.wind.speed >= this.impactThresholds.kicking.wind.low) {
      impacts.push({
        factor: 'wind',
        severity: 'medium',
        description: 'Moderate winds may affect longer kicks',
        impact: -2
      });
      totalImpact -= 2;
    }

    // Precipitation impact on kicking
    const precipRate = (weather.rain?.['1h'] || 0) + (weather.snow?.['1h'] || 0);
    if (precipRate >= this.impactThresholds.kicking.precipitation.high) {
      impacts.push({
        factor: 'precipitation',
        severity: 'high',
        description: 'Heavy precipitation will affect ball weight and footing',
        impact: -2
      });
      totalImpact -= 2;
    }

    return {
      impacts,
      totalImpact,
      recommendation: this.getPlayRecommendation('kicking', totalImpact)
    };
  }

  getPlayRecommendation(playType, impact) {
    if (impact >= -1) {
      return {
        rating: 'Favorable',
        color: '#28a745',
        message: `Good conditions for ${playType}`
      };
    } else if (impact >= -3) {
      return {
        rating: 'Challenging',
        color: '#ffc107',
        message: `Exercise caution with ${playType} plays`
      };
    } else {
      return {
        rating: 'Difficult',
        color: '#dc3545',
        message: `Consider limiting ${playType} plays`
      };
    }
  }
} 