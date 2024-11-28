export class FootballChartThemes {
  constructor() {
    this.initializeTheme();
  }

  initializeTheme() {
    Chart.defaults.color = '#4A4A4A';
    Chart.defaults.font.family = 'Arial, sans-serif';
    
    this.theme = {
      colors: {
        primary: '#2E5A27',    // field green
        secondary: '#8B4513',  // pigskin brown
        accent: '#D2B48C',     // leather tan
        background: '#F5F5F5', // chalk white
        text: '#4A4A4A'        // stadium gray
      },
      gradients: {
        temperature: {
          cold: '#0077be',     // cold blue
          mild: '#2E5A27',     // comfortable green
          hot: '#ff4d4d'       // hot red
        }
      }
    };

    // Register custom theme
    Chart.defaults.plugins.tooltip.backgroundColor = this.theme.colors.primary;
    Chart.defaults.plugins.tooltip.titleColor = '#fff';
    Chart.defaults.plugins.tooltip.bodyColor = '#fff';
    Chart.defaults.plugins.tooltip.borderColor = this.theme.colors.accent;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
  }

  getTemperatureGradient(ctx, chartArea) {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, this.theme.gradients.temperature.cold);
    gradient.addColorStop(0.5, this.theme.gradients.temperature.mild);
    gradient.addColorStop(1, this.theme.gradients.temperature.hot);
    return gradient;
  }

  applyChartStyles(chart, type) {
    switch (type) {
      case 'temperature':
        return {
          borderColor: this.theme.colors.secondary,
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          pointBackgroundColor: this.theme.colors.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: this.theme.colors.secondary
        };

      case 'wind':
        return {
          backgroundColor: [
            this.theme.colors.primary,
            this.theme.colors.accent,
            this.theme.colors.secondary
          ],
          borderColor: '#fff',
          borderWidth: 2
        };

      case 'precipitation':
        return {
          backgroundColor: this.theme.colors.primary,
          borderColor: this.theme.colors.secondary,
          borderWidth: 1
        };

      default:
        return {};
    }
  }

  getCustomTooltip(type) {
    return {
      backgroundColor: this.theme.colors.primary,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      cornerRadius: 4,
      callbacks: {
        label: (context) => {
          switch (type) {
            case 'temperature':
              return `${context.parsed.y}°F`;
            case 'wind':
              return `${context.parsed}%`;
            case 'precipitation':
              return `${context.parsed.y} inches`;
            default:
              return context.parsed.y;
          }
        }
      }
    };
  }
} 