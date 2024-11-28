class WeatherTrends {
  constructor(canvas, weatherData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.weatherData = weatherData;
  }

  drawTrendGraph() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 20;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw temperature trend
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 2;

    const timePoints = this.weatherData.map(d => new Date(d.dt * 1000));
    const temps = this.weatherData.map(d => d.main.temp);
    
    const xScale = (width - 2 * padding) / (timePoints.length - 1);
    const yScale = (height - 2 * padding) / (Math.max(...temps) - Math.min(...temps));

    timePoints.forEach((time, i) => {
      const x = padding + i * xScale;
      const y = height - (padding + (temps[i] - Math.min(...temps)) * yScale);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.stroke();
  }
} 