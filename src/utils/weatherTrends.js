import { FootballChartThemes } from './chartThemes';

export class WeatherChartManager {
  constructor(historicalAnalyzer) {
    this.historicalAnalyzer = historicalAnalyzer;
    this.chartThemes = new FootballChartThemes();
    this.loadChartLibrary();
  }

  async loadChartLibrary() {
    if (window.Chart) return;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  createTemperatureChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const chartArea = {
      top: 0,
      bottom: canvas.height
    };

    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.dt * 1000).toLocaleDateString()),
        datasets: [{
          label: 'Temperature (°F)',
          data: data.map(d => d.main.temp),
          ...this.chartThemes.applyChartStyles(this, 'temperature'),
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Historical Temperature Trends',
            color: this.chartThemes.theme.colors.text,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: this.chartThemes.getCustomTooltip('temperature')
        },
        scales: {
          y: {
            title: {
              display: true,
              text: 'Temperature (°F)',
              color: this.chartThemes.theme.colors.text
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  createWindPatternChart(canvas, windPatterns) {
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: Object.keys(windPatterns),
        datasets: [{
          data: Object.values(windPatterns),
          backgroundColor: [
            this.chartThemes.theme.colors.primary,
            this.chartThemes.theme.colors.accent,
            this.chartThemes.theme.colors.secondary
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Wind Pattern Distribution',
            color: this.chartThemes.theme.colors.text,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: this.chartThemes.theme.colors.text
            }
          }
        }
      }
    });
  }

  createConditionsChart(canvas, conditions) {
    const conditionsArray = Array.from(conditions.entries());
    
    return new Chart(canvas, {
      type: 'bar',
      data: {
        labels: conditionsArray.map(([condition]) => condition),
        datasets: [{
          label: 'Frequency',
          data: conditionsArray.map(([, count]) => count),
          backgroundColor: this.chartThemes.theme.colors.primary,
          borderColor: this.chartThemes.theme.colors.secondary,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Weather Conditions Frequency',
            color: this.chartThemes.theme.colors.text,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Days',
              color: this.chartThemes.theme.colors.text
            },
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  updateHistoricalView(container, analysis) {
    // Create canvas elements
    const tempCanvas = document.createElement('canvas');
    const windCanvas = document.createElement('canvas');
    const conditionsCanvas = document.createElement('canvas');

    container.appendChild(tempCanvas);
    container.appendChild(windCanvas);
    container.appendChild(conditionsCanvas);

    // Create charts
    this.createTemperatureChart(tempCanvas, analysis.historicalData);
    this.createWindPatternChart(windCanvas, analysis.windPatterns);
    this.createConditionsChart(conditionsCanvas, analysis.commonConditions);
  }
} 