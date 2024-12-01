// Constants and Initializations
const STADIUM_DATA_PATH = '/data/stadium_coordinates.json';
let stadiumDataCache = null;
let OPENWEATHER_API_KEY = localStorage.getItem('openweatherApiKey') || null;

// Load the stadium data and initialize the app
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Get the full URL for the JSON file
        const jsonURL = chrome.runtime.getURL(STADIUM_DATA_PATH);
        console.log('Attempting to fetch from:', jsonURL);

        // Fetch stadium data
        const stadiumDataResponse = await fetch(jsonURL);

        if (!stadiumDataResponse.ok) {
            throw new Error(`HTTP error! status: ${stadiumDataResponse.status}`);
        }

        // Parse JSON and log the raw data
        const stadiumDataRaw = await stadiumDataResponse.json();

        // Debugging logs
        console.log('Raw JSON structure:', JSON.stringify(stadiumDataRaw, null, 2));
        console.log('Keys in raw data:', Object.keys(stadiumDataRaw));
        console.log('Raw data:', stadiumDataRaw);
        console.log('Raw data type:', typeof stadiumDataRaw);
        console.log('Has NFL data:', Boolean(stadiumDataRaw.nfl));
        console.log('Has NCAA data:', Boolean(stadiumDataRaw.ncaa));

        if (stadiumDataRaw.nfl) {
            console.log('Number of NFL teams:', Object.keys(stadiumDataRaw.nfl).length);
        }
        if (stadiumDataRaw.ncaa) {
            console.log('Number of NCAA teams:', Object.keys(stadiumDataRaw.ncaa).length);
        }

        // Transform the data
        const transformedData = transformStadiumData(stadiumDataRaw);

        // Cache the transformed data
        stadiumDataCache = transformedData;

        // Populate custom dropdowns
        populateDropdowns(stadiumDataCache);

        // Add event listeners for settings, date picker, and refresh button
        const elements = {
            'weather-date': { handler: handleDateSelection, event: 'change' },
            'refresh': { handler: refreshWeather, event: 'click' },
            'settings': { handler: showSettings, event: 'click' },
        };

        Object.entries(elements).forEach(([id, config]) => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`✅ Adding ${config.event} listener to ${id}`);
                element.addEventListener(config.event, config.handler);
            } else {
                console.warn(`⚠️ Element with ID '${id}' not found`);
            }
        });

        // Initialize dark mode based on saved preference
        initializeDarkMode();

        // Ensure weatherList is hidden on initial load
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.style.display = 'none';
        }

    } catch (error) {
        console.error('Initialization failed:', error);
        console.error('Error stack:', error.stack);
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.innerHTML = `<div class="error-message">Failed to load stadium data: ${error.message}</div>`;
            weatherList.style.display = 'none'; // Ensure it's hidden on error
        }
    }
});

/**
 * Transforms raw stadium data into a structured format.
 * @param {Object} stadiumDataRaw - The raw JSON data fetched from the JSON file.
 * @returns {Object} - An object containing an array of stadiums.
 */
function transformStadiumData(stadiumDataRaw) {
    if (!stadiumDataRaw || typeof stadiumDataRaw !== 'object') {
        console.error('Invalid stadium data received:', stadiumDataRaw);
        return { stadiums: [] };
    }

    const stadiumsArray = [];

    // Log the raw data structure
    console.log('Transforming data with keys:', Object.keys(stadiumDataRaw));

    try {
        // Process NFL stadiums
        if (stadiumDataRaw.nfl && typeof stadiumDataRaw.nfl === 'object') {
            Object.entries(stadiumDataRaw.nfl).forEach(([name, info]) => {
                if (info && typeof info === 'object') {
                    stadiumsArray.push({
                        name,
                        team: info.team,
                        league: 'NFL',
                        latitude: info.latitude,
                        longitude: info.longitude,
                        location: info.location
                    });
                }
            });
        }

        // Process NCAA stadiums
        if (stadiumDataRaw.ncaa && typeof stadiumDataRaw.ncaa === 'object') {
            Object.entries(stadiumDataRaw.ncaa).forEach(([name, info]) => {
                if (info && typeof info === 'object') {
                    stadiumsArray.push({
                        name,
                        team: info.team,
                        league: 'NCAA',
                        latitude: info.latitude,
                        longitude: info.longitude,
                        location: info.location
                    });
                }
            });
        }

        console.log(`Transformed ${stadiumsArray.length} stadiums`);
        console.log(`NFL teams: ${stadiumsArray.filter(s => s.league === 'NFL').length}`);
        console.log(`NCAA teams: ${stadiumsArray.filter(s => s.league === 'NCAA').length}`);

        return { stadiums: stadiumsArray };
    } catch (error) {
        console.error('Error during transformation:', error);
        return { stadiums: [] };
    }
}

/**
 * Populates the custom dropdowns with team options.
 * @param {Object} stadiumData - The transformed stadium data.
 */
function populateDropdowns(stadiumData) {
    populateCustomDropdown('nfl', stadiumData.stadiums.filter(s => s.league === 'NFL'));
    populateCustomDropdown('college', stadiumData.stadiums.filter(s => s.league === 'NCAA'));
}

/**
 * Populates a custom dropdown with options.
 * @param {string} type - 'nfl' or 'college'.
 * @param {Array} teams - Array of stadium objects.
 */
function populateCustomDropdown(type, teams) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    if (!dropdown) return;

    const dropdownList = dropdown.querySelector('.dropdown-list');
    if (!dropdownList) return;

    // Clear existing options
    dropdownList.innerHTML = '';

    // Create a Set of unique team names
    const teamNames = new Set();
    teams.forEach(stadium => {
        if (stadium.team) {
            const teams = stadium.team.split(/,|\//);
            teams.forEach(team => teamNames.add(team.trim()));
        }
    });

    // Add 'All' option
    const allOption = document.createElement('li');
    allOption.textContent = type === 'nfl' ? 'NFL Teams' : 'College Teams';
    allOption.dataset.value = 'all';
    dropdownList.appendChild(allOption);

    // Create list items
    Array.from(teamNames)
        .sort()
        .forEach(team => {
            const listItem = document.createElement('li');
            listItem.textContent = team;
            listItem.dataset.value = team;
            dropdownList.appendChild(listItem);
        });

    // Event listeners for dropdown
    dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
        closeAllDropdowns(this);
        this.classList.toggle('active');
    });

    dropdownList.addEventListener('click', function (event) {
        event.stopPropagation();
        const selectedValue = event.target.dataset.value;
        const selectedText = event.target.textContent;
        dropdown.querySelector('.dropdown-selected').textContent = selectedText;
        dropdown.classList.remove('active');
        handleCustomDropdownSelection(type, selectedValue);
    });
}

/**
 * Handles selection from a custom dropdown.
 * @param {string} type - 'nfl' or 'college'.
 * @param {string} selectedValue - The selected team value.
 */
function handleCustomDropdownSelection(type, selectedValue) {
    console.log(`Selected ${type} team:`, selectedValue);

    // Reset the other dropdown
    const otherType = type === 'nfl' ? 'college' : 'nfl';
    const otherDropdown = document.getElementById(`${otherType}-dropdown`);
    if (otherDropdown) {
        otherDropdown.querySelector('.dropdown-selected').textContent = otherType === 'nfl' ? 'NFL Teams' : 'College Teams';
    }

    // Proceed with fetching weather
    if (selectedValue === 'all') {
        // Handle 'all' selection
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.innerHTML = '';
            weatherList.style.display = 'none';
        }
        return;
    }

    let selectedStadium = stadiumDataCache.stadiums.find(
        s =>
            s.team === selectedValue &&
            s.league === (type === 'nfl' ? 'NFL' : 'NCAA')
    );

    if (!selectedStadium) {
        // Attempt partial match
        selectedStadium = stadiumDataCache.stadiums.find(
            s =>
                s.team.toLowerCase().includes(selectedValue.toLowerCase()) &&
                s.league === (type === 'nfl' ? 'NFL' : 'NCAA')
        );
    }

    if (selectedStadium) {
        fetchWeather(selectedStadium);
    } else {
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.innerHTML = '<div class="error-message">Stadium not found</div>';
            weatherList.style.display = 'flex';
        }
    }
}

/**
 * Closes all open custom dropdowns except the current one.
 * @param {HTMLElement} currentDropdown - The dropdown to keep open.
 */
function closeAllDropdowns(currentDropdown) {
    const dropdowns = document.querySelectorAll('.custom-dropdown.active');
    dropdowns.forEach(dropdown => {
        if (dropdown !== currentDropdown) {
            dropdown.classList.remove('active');
        }
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function () {
    closeAllDropdowns();
});

/**
 * Fetches weather data for the selected stadium.
 * @param {Object} stadium - The selected stadium object.
 */
function fetchWeather(stadium) {
    if (!stadium) {
        console.error('❌ No stadium provided to fetchWeather');
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.innerHTML = '<div class="error-message">Stadium not found</div>';
            weatherList.style.display = 'flex'; // Show the error message container
        }
        return;
    }

    if (!OPENWEATHER_API_KEY) {
        console.warn('⚠️ OpenWeather API Key not set');
        const weatherList = document.getElementById('weatherList');
        if (weatherList) {
            weatherList.innerHTML = '<div class="error-message">API Key not set. Please set it in settings.</div>';
            weatherList.style.display = 'flex'; // Show the error message container
        }
        return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${stadium.latitude}&lon=${stadium.longitude}&units=imperial&appid=${OPENWEATHER_API_KEY}`;

    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');

    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    const weatherList = document.getElementById('weatherList');
    if (weatherList) {
        weatherList.style.display = 'none'; // Hide weatherList while loading
    }
    if (errorMessage) {
        errorMessage.style.display = 'none'; // Hide any previous error messages
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Weather API response error: ${response.status}`);
            }
            return response.json();
        })
        .then(weatherData => {
            console.log('☁️ Weather data:', weatherData);
            displayWeather(weatherData, stadium);
        })
        .catch(error => {
            console.error('❌ Weather API error:', error);
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            if (errorMessage) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Could not load weather data.';
            }
            if (weatherList) {
                weatherList.innerHTML = ''; // Clear any existing content
                weatherList.style.display = 'none'; // Ensure it's hidden
            }
        });
}

/**
 * Displays the weather data in the UI.
 * @param {Object} weatherData - The fetched weather data from OpenWeather API.
 * @param {Object} stadium - The stadium object associated with the weather data.
 */
function displayWeather(weatherData, stadium) {
    const weatherList = document.getElementById('weatherList');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');

    if (!weatherList) return;

    // Clear existing content
    weatherList.innerHTML = '';

    // Use the createWeatherCard function to create and render the card
    const weatherCard = createWeatherCard(weatherData, stadium);
    weatherList.appendChild(weatherCard);

    // Hide loading indicator and show weather list
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    if (weatherList) {
        weatherList.style.display = 'flex'; // Show the weatherList div now that data is loaded
    }
}

/**
 * Creates a weather card element based on the weather data and stadium information.
 * @param {Object} weatherData - The fetched weather data from OpenWeather API.
 * @param {Object} stadium - The stadium object associated with the weather data.
 * @returns {HTMLElement} - The constructed weather card element.
 */
function createWeatherCard(weatherData, stadium) {
    const card = document.createElement('div');
    card.className = 'game-card';

    const windSpeed = weatherData.wind ? Math.round(weatherData.wind.speed) : 'N/A';
    const humidity = weatherData.main ? weatherData.main.humidity : 'N/A';
    const feelsLike = weatherData.main ? Math.round(weatherData.main.feels_like) : 'N/A';
    const temp = weatherData.main ? Math.round(weatherData.main.temp) : 'N/A';
    const weatherDescription = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].description : '';
    const weatherIcon = weatherData.weather && weatherData.weather[0] ? weatherData.weather[0].icon : '';

    card.innerHTML = `
        <div class="weather-icon-container">
            <img class="weather-icon" 
                 src="https://openweathermap.org/img/w/${weatherIcon}.png" 
                 alt="${weatherDescription}">
            <div class="temperature">${temp}°F</div>
        </div>
        <div class="game-info">
            <h3>${stadium.name}</h3>
            <div class="team-name">${stadium.team}</div>
            <div class="conditions">${capitalizeFirstLetter(weatherDescription)}</div>
            <div class="weather-details">
                <div class="detail">
                    <span class="label">Feels like:</span> 
                    <span class="value">${feelsLike}°F</span>
                </div>
                <div class="detail">
                    <span class="label">Wind:</span> 
                    <span class="value">${windSpeed} mph</span>
                </div>
                <div class="detail">
                    <span class="label">Humidity:</span> 
                    <span class="value">${humidity}%</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

/**
 * Capitalizes the first letter of a given string.
 * @param {string} text - The string to capitalize.
 * @returns {string} - The capitalized string.
 */
function capitalizeFirstLetter(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Handles date selection from the date picker.
 * @param {Event} event - The change event from the date picker.
 */
function handleDateSelection(event) {
    const selectedDate = event.target.value;
    console.log('📅 Date selected:', selectedDate);

    // Future implementation for handling date changes
    // For example, filter weather data based on selected date
}

/**
 * Shows the settings modal.
 */
function showSettings() {
    console.log('⚙️ Opening settings');

    // Create and display the settings modal
    const modal = createSettingsModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Add event listeners for 'Save' and 'Cancel' buttons
    const saveBtn = modal.querySelector('.save-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    const closeModal = () => {
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
    };

    saveBtn.addEventListener('click', () => {
        console.log('💾 Saving settings');
        const darkModeEnabled = modal.querySelector('#darkMode').checked;
        const apiKeyInput = modal.querySelector('#apiKey').value.trim();

        // Save API key
        if (apiKeyInput) {
            OPENWEATHER_API_KEY = apiKeyInput;
            localStorage.setItem('openweatherApiKey', OPENWEATHER_API_KEY);
        }

        // Apply dark mode
        if (darkModeEnabled) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Save dark mode preference using localStorage
        localStorage.setItem('darkModeEnabled', darkModeEnabled);

        // Close the modal
        closeModal();

        // Refresh weather data after saving settings
        refreshWeather();
    });

    cancelBtn.addEventListener('click', () => {
        console.log('❌ Cancel settings');
        // Simply close the modal without saving
        closeModal();
    });

    // Close modal when clicking outside of it
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    });
}

/**
 * Refreshes the weather data based on the selected team.
 */
function refreshWeather() {
    // Get selected team from custom dropdowns
    const nflDropdown = document.getElementById('nfl-dropdown');
    const collegeDropdown = document.getElementById('college-dropdown');

    let selectedTeam = null;
    let dropdownType = null;

    const nflSelectedText = nflDropdown.querySelector('.dropdown-selected').textContent;
    const collegeSelectedText = collegeDropdown.querySelector('.dropdown-selected').textContent;

    if (nflSelectedText && nflSelectedText !== 'NFL Teams') {
        selectedTeam = nflSelectedText;
        dropdownType = 'nfl';
    } else if (collegeSelectedText && collegeSelectedText !== 'College Teams') {
        selectedTeam = collegeSelectedText;
        dropdownType = 'college';
    }

    console.log('🔄 Refreshing weather for:', { selectedTeam, dropdownType });

    if (selectedTeam) {
        handleCustomDropdownSelection(dropdownType, selectedTeam);
    } else {
        console.log('⚠️ No team selected for refresh');
        const weatherList = document.getElementById('weatherList');
        const errorMessage = document.getElementById('errorMessage');
        if (weatherList) {
            weatherList.innerHTML = '';
            weatherList.style.display = 'none'; // Hide weatherList when no team is selected
        }
        if (errorMessage) {
            errorMessage.style.display = 'none'; // Hide any error messages
        }
    }
}

/**
 * Creates the settings modal element.
 * @returns {HTMLElement} - The constructed settings modal element.
 */
function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';

    const content = document.createElement('div');
    content.className = 'settings-content';
    content.innerHTML = `
        <h2>Settings</h2>
        <div class="settings-section">
            <div class="setting-item">
                <label for="apiKey">OpenWeather API Key</label>
                <input type="text" id="apiKey" placeholder="Enter API Key" value="${OPENWEATHER_API_KEY || ''}" />
            </div>
            <div class="setting-item">
                <label for="darkMode">Dark Mode</label>
                <input type="checkbox" id="darkMode" ${document.body.classList.contains('dark-mode') ? 'checked' : ''} />
            </div>
        </div>
        <div class="settings-footer">
            <button class="cancel-btn">Cancel</button>
            <button class="save-btn">Save</button>
        </div>
    `;

    modal.appendChild(content);
    return modal;
}

/**
 * Initializes dark mode based on saved preference.
 */
function initializeDarkMode() {
    const darkModeEnabled = localStorage.getItem('darkModeEnabled') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}
