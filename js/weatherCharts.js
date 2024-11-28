class WeatherChartManager {
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
          ...this.chartThemes.applyChartStyles(chart, 'temperature'),
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
            '#2E5A27',  // calm
            '#D2B48C',  // moderate
            '#8B4513'   // strong
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Wind Pattern Distribution'
          },
          legend: {
            position: 'bottom'
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
          backgroundColor: '#2E5A27'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Weather Conditions Frequency'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Days'
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