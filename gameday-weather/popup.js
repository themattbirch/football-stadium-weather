document.addEventListener('DOMContentLoaded', function() {
    // Populate NFL Teams
    const nflTeams = [
        "Baltimore Ravens", "Cincinnati Bengals", "Cleveland Browns", "Pittsburgh Steelers",
        "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Tennessee Titans",
        "Buffalo Bills", "Miami Dolphins", "New England Patriots", "New York Jets",
        "Denver Broncos", "Kansas City Chiefs", "Las Vegas Raiders", "Los Angeles Chargers",
        "Chicago Bears", "Detroit Lions", "Green Bay Packers", "Minnesota Vikings",
        "Atlanta Falcons", "Carolina Panthers", "New Orleans Saints", "Tampa Bay Buccaneers",
        "Arizona Cardinals", "Los Angeles Rams", "San Francisco 49ers", "Seattle Seahawks",
        "Dallas Cowboys", "New York Giants", "Philadelphia Eagles", "Washington Commanders"
    ];

    const nflSelect = document.getElementById('nflTeams');
    nflTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        nflSelect.appendChild(option);
    });

    // Populate College Teams
    populateCollegeTeams();

    // Add event listeners
    document.getElementById('nflTeams').addEventListener('change', handleTeamSelection);
    document.getElementById('collegeTeams').addEventListener('change', handleTeamSelection);
    document.getElementById('gameDate').addEventListener('change', handleDateSelection);
    document.getElementById('refresh').addEventListener('click', refreshWeather);
    document.getElementById('settings').addEventListener('click', showSettings);
});

async function handleTeamSelection(event) {
    const selectedTeam = event.target.value;
    console.log(' Selected team:', selectedTeam);
    console.log('👉 From dropdown:', event.target.id);
    
    if (!selectedTeam) return;

    try {
        // Load stadium coordinates from our JSON file
        console.log('📍 Fetching stadium data...');
        const response = await fetch('data/stadium_coordinates.json');
        if (!response.ok) {
            throw new Error(`Failed to load stadium data: ${response.status}`);
        }
        
        const stadiumData = await response.json();
        console.log('📍 Available NFL stadiums:', Object.keys(stadiumData.nfl));
        console.log('📍 Available NCAA stadiums:', Object.keys(stadiumData.ncaa));

        // Find the matching stadium
        let stadium;
        if (event.target.id === 'nfl-teams') {
            console.log('🏈 Looking for NFL stadium for:', selectedTeam);
            stadium = Object.values(stadiumData.nfl)
                .find(s => {
                    const match = s.team.includes(selectedTeam);
                    console.log(`Checking ${s.team} -> ${match ? 'MATCH' : 'no match'}`);
                    return match;
                });
        } else if (event.target.id === 'collegeSelect') {
            console.log('🏈 Looking for college stadium for:', selectedTeam);
            stadium = Object.values(stadiumData.ncaa)
                .find(s => {
                    const match = s.team.includes(selectedTeam);
                    console.log(`Checking ${s.team} -> ${match ? 'MATCH' : 'no match'}`);
                    return match;
                });
        }

        console.log('🏟️ Found stadium:', stadium ? stadium.name : 'NOT FOUND');

        if (stadium) {
            console.log('🌍 Getting weather for:', {
                stadium: stadium.name,
                lat: stadium.latitude,
                lon: stadium.longitude
            });
            
            // Get weather for this stadium
            chrome.runtime.sendMessage({
                type: 'GET_WEATHER',
                latitude: stadium.latitude,
                longitude: stadium.longitude
            }, response => {
                console.log('☁️ Weather response:', response);
                if (response && response.weather) {
                    displayWeather(response.weather);
                } else {
                    console.error('❌ No weather data in response');
                    weatherList.innerHTML = '<div class="error">Could not load weather data</div>';
                }
            });
        } else {
            console.error('❌ No stadium found for:', selectedTeam);
            weatherList.innerHTML = '<div class="error">Stadium not found</div>';
        }
    } catch (error) {
        console.error('❌ Error handling team selection:', error);
        weatherList.innerHTML = '<div class="error">Error loading stadium data</div>';
    }
}

function displayWeather(forecast) {
    const weatherList = document.getElementById('weatherList');
    weatherList.innerHTML = '';

    const weatherCard = document.createElement('div');
    weatherCard.className = 'game-card';

    const weatherInfo = `
        <div class="weather-icon">
            <img src="${forecast.day.condition.icon}" alt="${forecast.day.condition.text}">
        </div>`;

    weatherCard.innerHTML = weatherInfo;
    weatherList.appendChild(weatherCard);
}

function createDateInput() {
    const dateContainer = document.createElement('div');
    dateContainer.className = 'date-container';

    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.id = 'dateInput';
    dateInput.value = 'Weather Date';
    
    dateInput.addEventListener('focus', (e) => {
        if (e.target.value === 'Weather Date') {
            e.target.value = '';
        }
        e.target.type = 'date';
    });
    
    dateInput.addEventListener('blur', (e) => {
        if (!e.target.value) {
            e.target.type = 'text';
            e.target.value = 'Weather Date';
        }
    });
    
    dateContainer.appendChild(dateInput);
    
    return dateContainer;
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';

    const header = document.createElement('div');
    header.className = 'settings-modal-header';
    header.innerHTML = '<h2>Settings</h2>';

    const content = document.createElement('div');
    content.className = 'settings-modal-content';
    // Add your settings content here

    const footer = document.createElement('div');
    footer.className = 'settings-modal-footer';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = 'Save';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);

    return modal;
} 