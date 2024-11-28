const collegeTeams = [
    'Air Force', 'Akron', 'Alabama', 'Alabama A&M', 'Alabama State', 'Albany', 'Alcorn State',
    'Appalachian State', 'Arizona', 'Arizona State', 'Arkansas', 'Arkansas State', 'Army',
    'Auburn', 'Ball State', 'Baylor', 'Boise State', 'Boston College', 'Bowling Green', 'Buffalo',
    'BYU', 'California', 'Central Michigan', 'Cincinnati', 'Clemson', 'Coastal Carolina',
    'Colorado', 'Colorado State', 'Connecticut', 'Duke', 'East Carolina', 'Eastern Michigan',
    'FIU', 'Florida', 'Florida A&M', 'Florida Atlantic', 'Florida State', 'Fresno State',
    'Georgia', 'Georgia Southern', 'Georgia State', 'Georgia Tech', 'Hawaii', 'Houston',
    'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Iowa State', 'James Madison', 'Kansas',
    'Kansas State', 'Kent State', 'Kentucky', 'Liberty', 'Louisiana', 'Louisiana Tech',
    'Louisville', 'LSU', 'Marshall', 'Maryland', 'Memphis', 'Miami (FL)', 'Miami (OH)',
    'Michigan', 'Michigan State', 'Middle Tennessee', 'Minnesota', 'Mississippi State',
    'Missouri', 'Navy', 'NC State', 'Nebraska', 'Nevada', 'New Mexico', 'New Mexico State',
    'North Carolina', 'North Texas', 'Northern Illinois', 'Northwestern', 'Notre Dame',
    'Ohio', 'Ohio State', 'Oklahoma', 'Oklahoma State', 'Old Dominion', 'Ole Miss', 'Oregon',
    'Oregon State', 'Penn State', 'Pittsburgh', 'Purdue', 'Rice', 'Rutgers', 'San Diego State',
    'San Jose State', 'SMU', 'South Alabama', 'South Carolina', 'South Florida', 'Southern Miss',
    'Stanford', 'Syracuse', 'TCU', 'Temple', 'Tennessee', 'Texas', 'Texas A&M', 'Texas State',
    'Texas Tech', 'Toledo', 'Troy', 'Tulane', 'Tulsa', 'UAB', 'UCF', 'UCLA', 'UMass',
    'UNLV', 'USC', 'UTEP', 'UTSA', 'Utah', 'Utah State', 'Vanderbilt', 'Virginia',
    'Virginia Tech', 'Wake Forest', 'Washington', 'Washington State', 'West Virginia',
    'Western Kentucky', 'Western Michigan', 'Wisconsin', 'Wyoming'
].sort();

function populateCollegeTeams() {
    const collegeDropdown = document.getElementById('college-teams');
    collegeTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        collegeDropdown.appendChild(option);
    });
}

function closeSettingsModal() {
    const modal = document.querySelector('.settings-modal');
    modal.classList.add('closing');
    
    modal.addEventListener('animationend', function() {
        modal.style.display = 'none';
        modal.classList.remove('closing');
    }, { once: true });
}

function openSettingsModal() {
    const modal = document.querySelector('.settings-modal');
    modal.style.display = 'block';
} 