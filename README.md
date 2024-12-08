# Football Stadium Weather

A Chrome extension that provides real-time weather information for NFL and NCAA football stadiums.

## Features

- **Real-time Weather Data**: Get current weather conditions for any NFL or NCAA football stadium
- **Easy Search**: Quick search functionality for both NFL and college teams
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Temperature Units**: Switch between Fahrenheit and Celsius
- **Offline Support**: Last-viewed stadium weather data is cached locally
- **Responsive Design**: Works seamlessly across different screen sizes

## Installation

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/football-stadium-weather/foglniidjfhhchgemahaigkmjpfephmg?authuser=0&hl=en)
2. Click "Add to Chrome"
3. Click "Add Extension" in the popup

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select either NFL or College teams from the dropdown
3. Search or scroll to find your desired team
4. View current weather conditions including:
   - Temperature
   - "Feels like" temperature
   - Wind speed
   - Humidity
   - Weather conditions

## Privacy

- No personal data is collected
- Stadium coordinates are pre-stored
- Weather data is fetched through a secure proxy
- Local storage is used only for user preferences and temporary caching

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Weather data provided by OpenWeather API
- Secure proxy server built with Vercel

# Load the unpacked extension in Chrome:

1. Open Chrome Extensions (chrome://extensions/)
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the project directory