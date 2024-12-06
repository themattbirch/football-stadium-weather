// Constants and Initializations
const STADIUM_DATA_PATH = "/data/stadium_coordinates.json";
let stadiumDataCache = null;
let OPENWEATHER_API_KEY = null;

// Load the stadium data + initialize app
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize settings + API key
    const settings = SettingsManager.init();

    // Get the full URL for JSON file
    const jsonURL = chrome.runtime.getURL(STADIUM_DATA_PATH);
    console.log("Attempting to fetch from:", jsonURL);

    // Fetch stadium data
    const stadiumDataResponse = await fetch(jsonURL);

    if (!stadiumDataResponse.ok) {
      throw new Error(`HTTP error! status: ${stadiumDataResponse.status}`);
    }

    // Parse JSON + log raw data
    const stadiumDataRaw = await stadiumDataResponse.json();

    // Transform the data
    const transformedData = transformStadiumData(stadiumDataRaw);

    // Cache transformed data
    stadiumDataCache = transformedData;

    // Populate custom dropdowns
    populateDropdowns(stadiumDataCache);

    // Event listeners for settings, date picker, and refresh button
    const elements = {
      "weather-date": { handler: handleDateSelection, event: "change" },
      refresh: { handler: refreshWeather, event: "click" },
      settings: { handler: showSettings, event: "click" },
    };

    Object.entries(elements).forEach(([id, config]) => {
      const element = document.getElementById(id);
      if (element) {
        console.log(`✅ Adding ${config.event} listener to ${id}`);
        element.addEventListener(config.event, config.handler);
      } else {
        console.log(`ℹ️ Element with ID '${id}' not found`);
      }
    });

    // Initialize dark mode based on saved preference
    initializeDarkMode();

    // Ensure weatherList is hidden on initial load
    const weatherList = document.getElementById("weatherList");
    if (weatherList) {
      weatherList.style.display = "none";
    }
  } catch (error) {
    console.error("Initialization failed:", error);
    console.error("Error stack:", error.stack);
    const weatherList = document.getElementById("weatherList");
    if (weatherList) {
      weatherList.innerHTML = `<div class="error-message">Failed to load stadium data: ${error.message}</div>`;
      weatherList.style.display = "none"; // Ensure it's hidden on error
    }
  }
});

/**
 * Transforms raw stadium data into a structured format.
 * @param {Object} stadiumDataRaw - The raw JSON data fetched from the JSON file.
 * @returns {Object} - An object containing an array of stadiums.
 */
function transformStadiumData(stadiumDataRaw) {
  if (!stadiumDataRaw || typeof stadiumDataRaw !== "object") {
    console.error("Invalid stadium data received:", stadiumDataRaw);
    return { stadiums: [] };
  }

  const stadiumsArray = [];

  try {
    // Process NFL stadiums
    if (stadiumDataRaw.nfl && typeof stadiumDataRaw.nfl === "object") {
      Object.entries(stadiumDataRaw.nfl).forEach(([name, info]) => {
        if (info && typeof info === "object") {
          stadiumsArray.push({
            name,
            team: info.team,
            league: "NFL",
            latitude: info.latitude,
            longitude: info.longitude,
            location: info.location,
          });
        }
      });
    }

    // Process NCAA stadiums
    if (stadiumDataRaw.ncaa && typeof stadiumDataRaw.ncaa === "object") {
      Object.entries(stadiumDataRaw.ncaa).forEach(([name, info]) => {
        if (info && typeof info === "object") {
          stadiumsArray.push({
            name,
            team: info.team,
            league: "NCAA",
            latitude: info.latitude,
            longitude: info.longitude,
            location: info.location,
          });
        }
      });
    }

    return { stadiums: stadiumsArray };
  } catch (error) {
    console.error("Error during transformation:", error);
    return { stadiums: [] };
  }
}

/**
 * Populates the custom dropdowns with team options.
 * @param {Object} stadiumData - The transformed stadium data.
 */
function populateDropdowns(stadiumData) {
  populateCustomDropdown(
    "nfl",
    stadiumData.stadiums.filter((s) => s.league === "NFL")
  );
  populateCustomDropdown(
    "college",
    stadiumData.stadiums.filter((s) => s.league === "NCAA")
  );
}

/**
 * Populates a custom dropdown with options and adds search functionality.
 * @param {string} type - 'nfl' or 'college'.
 * @param {Array} teams - Array of stadium objects.
 */
function populateCustomDropdown(type, teams) {
  const dropdown = document.getElementById(`${type}-dropdown`);
  if (!dropdown) return;

  const dropdownList = dropdown.querySelector(".dropdown-list");
  if (!dropdownList) return;

  // Clear existing options
  dropdownList.innerHTML = "";

  // Add search input
  const searchItem = document.createElement("li");
  searchItem.className = "dropdown-search";
  searchItem.innerHTML = '<input type="text" placeholder="Search teams..." />';
  dropdownList.appendChild(searchItem);

  const searchInput = searchItem.querySelector("input");

  // Create a Set of unique team names
  const teamNames = new Set();
  teams.forEach((stadium) => {
    if (stadium.team) {
      const teams = stadium.team.split(/,|\//);
      teams.forEach((team) => teamNames.add(team.trim()));
    }
  });

  // Add 'All' option
  const allOption = document.createElement("li");
  allOption.textContent = type === "nfl" ? "NFL Teams" : "College Teams";
  allOption.dataset.value = "all";
  dropdownList.appendChild(allOption);

  // Create list items
  const teamListItems = [];
  Array.from(teamNames)
    .sort()
    .forEach((team) => {
      const listItem = document.createElement("li");
      listItem.textContent = team;
      listItem.dataset.value = team;
      dropdownList.appendChild(listItem);
      teamListItems.push(listItem);
    });

  // Event listeners for dropdown
  dropdown.addEventListener("click", function (event) {
    event.stopPropagation();
    closeAllDropdowns(this);
    this.classList.toggle("active");
    // Focus on the search input when dropdown is opened
    if (this.classList.contains("active")) {
      searchInput.focus();
    }
    // Ensure the scroll position is reset
    const dropdownList = this.querySelector(".dropdown-list");
    if (dropdownList) {
      dropdownList.scrollTop = 0; // Reset scroll position on open
    }
  });

  dropdownList.addEventListener("click", function (event) {
    event.stopPropagation();
    if (
      event.target.tagName.toLowerCase() === "li" &&
      !event.target.classList.contains("dropdown-search")
    ) {
      const selectedValue = event.target.dataset.value;
      const selectedText = event.target.textContent;
      dropdown.querySelector(".dropdown-selected").textContent = selectedText;
      dropdown.classList.remove("active");
      handleCustomDropdownSelection(type, selectedValue);
    }
  });

  // Handle keyboard navigation
  dropdown.addEventListener("keydown", function (event) {
    const active = dropdown.classList.contains("active");
    const dropdownList = this.querySelector(".dropdown-list");

    if (!dropdownList) return; // Guard clause

    if (event.key === "Enter") {
      event.preventDefault();
      if (active) {
        const visibleItems = Array.from(
          dropdownList.querySelectorAll(
            'li:not(.dropdown-search):not([style*="display: none"])'
          )
        );
        if (visibleItems.length > 0) {
          visibleItems[0].click(); // Select first visible item
        }
      } else {
        dropdown.click(); // Open dropdown
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const scrollStep = 30;
      const maxScroll = dropdownList.scrollHeight - dropdownList.clientHeight;
      dropdownList.scrollTop = Math.min(
        dropdownList.scrollTop + scrollStep,
        maxScroll
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const scrollStep = 30;
      dropdownList.scrollTop = Math.max(dropdownList.scrollTop - scrollStep, 0);
    } else if (event.key === "Escape") {
      if (active) {
        dropdown.classList.remove("active");
      }
    }
  });

  // Add input event listener for search functionality
  searchInput.addEventListener("input", function () {
    const filter = searchInput.value.toLowerCase();
    teamListItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(filter)) {
        item.style.display = "";
      } else {
        item.style.display = "none";
      }
    });
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
  const otherType = type === "nfl" ? "college" : "nfl";
  const otherDropdown = document.getElementById(`${otherType}-dropdown`);
  if (otherDropdown) {
    otherDropdown.querySelector(".dropdown-selected").textContent =
      otherType === "nfl" ? "NFL Teams" : "College Teams";
  }

  // Proceed with fetching weather
  if (selectedValue === "all") {
    // Handle 'all' selection
    const weatherList = document.getElementById("weatherList");
    if (weatherList) {
      weatherList.innerHTML = "";
      weatherList.style.display = "none";
    }
    return;
  }

  let selectedStadium = stadiumDataCache.stadiums.find(
    (s) =>
      s.team === selectedValue && s.league === (type === "nfl" ? "NFL" : "NCAA")
  );

  if (!selectedStadium) {
    // Attempt partial match
    selectedStadium = stadiumDataCache.stadiums.find(
      (s) =>
        s.team.toLowerCase().includes(selectedValue.toLowerCase()) &&
        s.league === (type === "nfl" ? "NFL" : "NCAA")
    );
  }

  if (selectedStadium) {
    enhancedFetchWeather(selectedStadium);
  } else {
    const weatherList = document.getElementById("weatherList");
    if (weatherList) {
      weatherList.innerHTML =
        '<div class="error-message">Stadium not found</div>';
      weatherList.style.display = "flex";
    }
  }
}

/**
 * Closes all open custom dropdowns except the current one.
 * @param {HTMLElement} currentDropdown - The dropdown to keep open.
 */
function closeAllDropdowns(currentDropdown) {
  const dropdowns = document.querySelectorAll(".custom-dropdown.active");
  dropdowns.forEach((dropdown) => {
    if (dropdown !== currentDropdown) {
      dropdown.classList.remove("active");
    }
  });
}

// Close dropdowns when clicking outside
document.addEventListener("click", function () {
  closeAllDropdowns();
});

function showLoadingIndicator() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "block";
  }
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }
}

function showErrorMessage(message) {
  const errorMessage = document.getElementById("errorMessage");
  if (errorMessage) {
    errorMessage.style.display = "block";
    errorMessage.textContent = message;
  }
}

function hideErrorMessage() {
  const errorMessage = document.getElementById("errorMessage");
  if (errorMessage) {
    errorMessage.style.display = "none";
    errorMessage.textContent = "";
  }
}

function clearWeatherData() {
  const weatherList = document.getElementById("weatherList");
  if (weatherList) {
    weatherList.innerHTML = "";
    weatherList.style.display = "none";
  }
}

function showOfflineMessage() {
  clearWeatherData(); // Clear any existing weather display
  const weatherList = document.getElementById("weatherList");
  if (weatherList) {
    weatherList.innerHTML = `
            <div class="offline-message">
                <h3>You are offline</h3>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
    weatherList.style.display = "flex";
  }
}

/**
 * Fetches weather data for the selected stadium, handling offline scenarios.
 * @param {Object} stadium - The selected stadium object.
 */
// Option 1: Enhanced Error Handling and Recovery
function enhancedFetchWeather(stadium) {
  if (!stadium) {
    console.error("❌ No stadium provided to fetchWeather");
    showErrorMessage("Stadium not found");
    hideLoadingIndicator();
    return;
  }

  // Add retry mechanism
  let retryCount = 0;
  const maxRetries = 3;

  // Constants and Initializations
  function attemptFetch() {
    showLoadingIndicator();
    clearWeatherData();
    hideErrorMessage();

    // Enhanced offline handling
    if (!navigator.onLine) {
      console.log("📡 Network status: offline");
      clearWeatherData(); // Clear any existing weather display

      const weatherList = document.getElementById("weatherList");
      if (weatherList) {
        weatherList.innerHTML = `
                <div class="offline-message">
                    <h3>You are offline</h3>
                    <p>Please check your internet connection and try again.</p>
                </div>
            `;
        weatherList.style.display = "flex";
      }

      hideLoadingIndicator();
      return;
    }

    // Online behavior - send message to background script
    chrome.runtime.sendMessage(
      {
        type: "GET_WEATHER",
        latitude: stadium.latitude,
        longitude: stadium.longitude,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Message error:", chrome.runtime.lastError);
          handleFetchError("Communication error with background script");
          return;
        }

        if (response.error) {
          console.error("Weather fetch error:", response.error);
          handleFetchError("Weather data fetch failed");
          return;
        }

        // Store weather data with timestamp
        try {
          localStorage.setItem("weatherData", JSON.stringify(response));
          localStorage.setItem("weatherDataTimestamp", Date.now().toString());
          console.log("💾 Weather data cached successfully");
        } catch (error) {
          console.log("📝 Cache status: Failed to store weather data:", error);
        }

        hideLoadingIndicator();
        displayWeather(response, stadium);
      }
    );
  }

  function handleFetchError(errorMessage) {
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`🔄 Retry attempt ${retryCount} of ${maxRetries}`);
      setTimeout(attemptFetch, 1000 * retryCount); // Exponential backoff
    } else {
      hideLoadingIndicator();
      showErrorMessage(`${errorMessage} (after ${maxRetries} retries)`);
      // Try to use cached data as fallback
      const cachedData = localStorage.getItem("weatherData");
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          displayWeather(parsedData, stadium);
          showErrorMessage("Showing cached data due to fetch failure");
        } catch (error) {
          console.error("Fallback cache error:", error);
        }
      }
    }
  }

  attemptFetch();
}

const SettingsManager = {
  defaults: {
    darkMode: false,
    temperatureUnit: "F",
    refreshInterval: 300000,
    retryAttempts: 3,
    cacheExpiry: 3600000,
  },

  init() {
    this.migrateOldSettings();
    this.validateSettings();
    return this.getAll();
  },

  migrateOldSettings() {
    // Remove openweatherApiKey from migration logic
    try {
      const oldSettings = {
        darkModeEnabled: localStorage.getItem("darkModeEnabled"),
        temperatureUnit: localStorage.getItem("temperatureUnit"),
      };

      if (Object.values(oldSettings).some((value) => value !== null)) {
        const settings = this.getAll();
        Object.entries(oldSettings).forEach(([key, value]) => {
          if (value !== null) {
            settings[key] =
              key === "darkModeEnabled" ? value === "true" : value;
          }
        });
        this.saveAll(settings);

        // Clean up old settings
        Object.keys(oldSettings).forEach((key) => localStorage.removeItem(key));
        console.log("🔄 Settings migrated successfully");
      }
    } catch (error) {
      console.error("Settings migration failed:", error);
    }
  },

  validateSettings() {
    const settings = this.getAll();
    let needsSave = false;

    // Ensure all defaults exist
    Object.entries(this.defaults).forEach(([key, defaultValue]) => {
      if (settings[key] === undefined) {
        settings[key] = defaultValue;
        needsSave = true;
      }
    });

    // Validate specific settings
    if (settings.refreshInterval < 60000) {
      // Minimum 1 minute
      settings.refreshInterval = 60000;
      needsSave = true;
    }

    if (settings.retryAttempts < 1 || settings.retryAttempts > 5) {
      settings.retryAttempts = this.defaults.retryAttempts;
      needsSave = true;
    }

    if (needsSave) {
      this.saveAll(settings);
    }
  },

  getAll() {
    try {
      const settings = localStorage.getItem("settings");
      return settings ? JSON.parse(settings) : { ...this.defaults };
    } catch (error) {
      console.error("Error reading settings:", error);
      return { ...this.defaults };
    }
  },

  saveAll(settings) {
    try {
      localStorage.setItem("settings", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  },
};

/**
 * Displays the weather data in the UI.
 * @param {Object} weatherData - The weather data object.
 * @param {Object} stadium - The stadium object.
 */
function displayWeather(weatherData, stadium) {
  if (!weatherData || !weatherData.weather || !weatherData.main) {
    showErrorMessage("Incomplete weather data.");
    return;
  }

  const weatherList = document.getElementById("weatherList");
  if (!weatherList) return;

  // Clear existing content
  weatherList.innerHTML = "";

  // Create weather card
  const weatherCard = createWeatherCard(weatherData, stadium);
  weatherList.appendChild(weatherCard);

  // Show the weatherList container
  weatherList.style.display = "flex";
}

/**
 * Creates a weather card element with the provided data.
 * @param {Object} weatherData - The weather data object.
 * @param {Object} stadium - The stadium object.
 * @returns {HTMLElement} - The weather card element.
 */
function createWeatherCard(weatherData, stadium) {
  const card = document.createElement("div");
  card.className = "game-card";

  const windSpeed = weatherData.wind
    ? Math.round(weatherData.wind.speed)
    : "N/A";
  const humidity = weatherData.main ? weatherData.main.humidity : "N/A";
  let feelsLike = weatherData.main ? weatherData.main.feels_like : "N/A";
  let temp = weatherData.main ? weatherData.main.temp : "N/A";
  const weatherDescription =
    weatherData.weather && weatherData.weather[0]
      ? weatherData.weather[0].description
      : "";
  const weatherIcon =
    weatherData.weather && weatherData.weather[0]
      ? weatherData.weather[0].icon
      : "";

  // Get temperature unit preference from localStorage
  const settings = SettingsManager.getAll();
  const temperatureUnit = settings.temperatureUnit;

  // Convert temperatures if unit is Celsius
  let tempUnit = "°F";
  if (temperatureUnit === "C" && temp !== "N/A" && feelsLike !== "N/A") {
    temp = ((temp - 32) * (5 / 9)).toFixed(1);
    feelsLike = ((feelsLike - 32) * (5 / 9)).toFixed(1);
    tempUnit = "°C";
  } else if (temp !== "N/A" && feelsLike !== "N/A") {
    temp = temp.toFixed(1);
    feelsLike = feelsLike.toFixed(1);
  }

  card.innerHTML = `
    <div class="weather-icon-container">
      ${
        weatherIcon
          ? `<img class="weather-icon" src="https://openweathermap.org/img/w/${weatherIcon}.png" alt="${weatherDescription}">`
          : ""
      }
      <div class="temperature">${temp !== "N/A" ? temp + tempUnit : "N/A"}</div>
    </div>
    <div class="game-info">
      <h3>${stadium.name || "Unknown Stadium"}</h3>
      <div class="team-name">${stadium.team || "Unknown Team"}</div>
      <div class="conditions">${
        capitalizeFirstLetter(weatherDescription) || "N/A"
      }</div>
      <div class="weather-details">
        <div class="detail">
          <span class="label">Feels like:</span> 
          <span class="value">${
            feelsLike !== "N/A" ? feelsLike + tempUnit : "N/A"
          }</span>
        </div>
        <div class="detail">
          <span class="label">Wind:</span> 
          <span class="value">${
            windSpeed !== "N/A" ? windSpeed + " mph" : "N/A"
          }</span>
        </div>
        <div class="detail">
          <span class="label">Humidity:</span> 
          <span class="value">${
            humidity !== "N/A" ? humidity + "%" : "N/A"
          }</span>
        </div>
      </div>
    </div>
  `;

  return card;
}

/**
 * Capitalizes the first letter of a given text.
 * @param {string} text - The text to capitalize.
 * @returns {string} - The capitalized text.
 */
function capitalizeFirstLetter(text) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Event listeners and other functions can be added below as needed

/**
 * Handles date selection from the date picker.
 * @param {Event} event - The change event from the date picker.
 */
function handleDateSelection(event) {
  const selectedDate = event.target.value;
  console.log("📅 Date selected:", selectedDate);

  // Future implementation for handling date changes
  // For example, filter weather data based on selected date
}

//Shows the settings modal

function showSettings() {
  console.log("⚙️ Opening settings");

  // Create and display the settings modal
  const modal = createSettingsModal();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Add event listeners for 'Save' and 'Cancel' buttons
  const saveBtn = modal.querySelector(".save-btn");
  const cancelBtn = modal.querySelector(".cancel-btn");

  const closeModal = () => {
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
  };

  saveBtn.addEventListener("click", () => {
    console.log("💾 Saving settings");
    const darkModeEnabled = modal.querySelector("#darkMode").checked;
    const temperatureUnit = modal.querySelector("#temperatureUnit").value;

    // Apply dark mode
    if (darkModeEnabled) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    // Save preferences
    localStorage.setItem("darkModeEnabled", darkModeEnabled);
    localStorage.setItem("temperatureUnit", temperatureUnit);

    // Close the modal
    closeModal();

    // Refresh weather data after saving settings
    refreshWeather();
  });

  cancelBtn.addEventListener("click", () => {
    console.log("❌ Cancel settings");
    // Simply close the modal without saving
    closeModal();
  });

  // Close modal when clicking outside of it
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });
}

// Refreshes the weather data based on the selected team.

function refreshWeather() {
  // Get selected team from custom dropdowns
  const nflDropdown = document.getElementById("nfl-dropdown");
  const collegeDropdown = document.getElementById("college-dropdown");

  let selectedTeam = null;
  let dropdownType = null;

  const nflSelectedText =
    nflDropdown.querySelector(".dropdown-selected").textContent;
  const collegeSelectedText =
    collegeDropdown.querySelector(".dropdown-selected").textContent;

  if (nflSelectedText && nflSelectedText !== "NFL Teams") {
    selectedTeam = nflSelectedText;
    dropdownType = "nfl";
  } else if (collegeSelectedText && collegeSelectedText !== "College Teams") {
    selectedTeam = collegeSelectedText;
    dropdownType = "college";
  }

  console.log("🔄 Refreshing weather for:", { selectedTeam, dropdownType });

  if (selectedTeam) {
    handleCustomDropdownSelection(dropdownType, selectedTeam);
  } else {
    console.log("⚠️ No team selected for refresh");
    const weatherList = document.getElementById("weatherList");
    const errorMessage = document.getElementById("errorMessage");
    if (weatherList) {
      weatherList.innerHTML = "";
      weatherList.style.display = "none"; // Hide weatherList when no team is selected
    }
    if (errorMessage) {
      errorMessage.style.display = "none"; // Hide any error messages
    }
  }
}

/**
 * Creates the settings modal element.
 * @returns {HTMLElement} - The constructed settings modal element.
 */
function createSettingsModal() {
  const modal = document.createElement("div");
  modal.className = "settings-modal";
  const content = document.createElement("div");
  content.className = "settings-content";

  const settings = SettingsManager.getAll();

  content.innerHTML = `
    <h2>Settings</h2>
    <div class="settings-section">
        <div class="setting-item">
            <label for="darkMode">Dark Mode</label>
            <input type="checkbox" id="darkMode" ${
              settings.darkMode ? "checked" : ""
            } />
        </div>
        <div class="setting-item">
            <label for="temperatureUnit">Temperature Unit</label>
            <select id="temperatureUnit">
                <option value="F" ${
                  settings.temperatureUnit === "F" ? "selected" : ""
                }>Fahrenheit (°F)</option>
                <option value="C" ${
                  settings.temperatureUnit === "C" ? "selected" : ""
                }>Celsius (°C)</option>
            </select>
        </div>
    </div>
    <div class="settings-footer">
        <div class="privacy-policy-container">
            <a href="https://stadiumweather.app/privacy.html" target="_blank" class="privacy-link">
                Privacy Policy
            </a>
        </div>
        <div class="button-container">
            <button class="cancel-btn">Cancel</button>
            <button class="save-btn">Save</button>
        </div>
    </div>
`;
  modal.appendChild(content);
  return modal;
}

//Initializes dark mode based on saved preference.
function initializeDarkMode() {
  const settings = SettingsManager.getAll();
  if (settings.darkMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}
