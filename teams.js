const collegeTeams = [
    "Alabama Crimson Tide",
    "Ohio State Buckeyes",
    "Georgia Bulldogs",
    // ... (Add all NCAA Division I teams)
    "Wyoming Cowboys"
].sort();

// Update the populateCollegeTeams function to use this array
function populateCollegeTeams() {
    const select = document.getElementById('collegeTeams');
    collegeTeams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        select.appendChild(option);
    });
} 