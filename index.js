
// Tab functionality
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].className = tabContents[i].className.replace(" active", "");
    }

    const tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" active", "");
    }

    document.getElementById(tabName).className += " active";
    evt.currentTarget.className += " active";
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}

// Switch coordinates to the reverse tab
function switchToReverseWithCoords(lat, lon) {
    // Switch to reverse tab
    openTab({ currentTarget: document.getElementsByClassName("tab")[1] }, 'reverseTab');

    // Populate the fields
    document.getElementById('latInput').value = lat;
    document.getElementById('lonInput').value = lon;

    // Execute the search
    findPlace();
}

// Switch place name to forward tab
function switchToForwardWithPlace(placeName) {
    // Switch to forward tab
    openTab({ currentTarget: document.getElementsByClassName("tab")[0] }, 'forwardTab');

    // Populate the field
    document.getElementById('placeInput').value = placeName;

    // Execute the search
    findCoordinates();
}

// Forward geocoding (place name to coordinates)
async function findCoordinates() {
    const placeInput = document.getElementById('placeInput').value.trim();
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    // Clear previous results
    resultDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    if (!placeInput) {
        errorDiv.textContent = 'Please enter a place name';
        errorDiv.style.display = 'block';
        return;
    }

    loadingDiv.style.display = 'block';

    try {
        // Using OpenStreetMap Nominatim API for geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeInput)}&limit=5`);
        const data = await response.json();

        loadingDiv.style.display = 'none';

        if (data.length === 0) {
            errorDiv.textContent = 'No results found for this place. Please try a different query.';
            errorDiv.style.display = 'block';
            return;
        }

        resultDiv.style.display = 'block';

        // Display the results
        data.forEach(place => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            // Format decimal degrees with degree symbol
            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);
            const latDeg = Math.abs(lat).toFixed(4) + "° " + (lat >= 0 ? "N" : "S");
            const lonDeg = Math.abs(lon).toFixed(4) + "° " + (lon >= 0 ? "E" : "W");

            // Format decimal for plain coordinates
            const decimalCoords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

            // Format the output text for copying
            const formattedOutput = `The approximate coordinates for **${place.display_name}** are:
📍 **Latitude:** \`${latDeg}\` 📍 **Longitude:** \`${lonDeg}\`
In decimal format: ➡️ \`${decimalCoords}\``;

            // Create a formatted HTML version for display
            const htmlOutput = `
                        <p>The approximate coordinates for <strong>${place.display_name}</strong> are:</p>
                        <div class="coordinates-box">
                            📍 <strong>Latitude:</strong> <code>${latDeg}</code> 📍 <strong>Longitude:</strong> <code>${lonDeg}</code><br>
                            In decimal format: ➡️ <code>${decimalCoords}</code>
                        </div>
                        <div>
                            <button class="copy-btn" onclick="copyToClipboard(\`${formattedOutput}\`)">Copy Formatted Result</button>
                            <button class="switch-button" onclick="switchToReverseWithCoords(${lat}, ${lon})">Use these coordinates for reverse lookup</button>
                        </div>
                    `;

            resultItem.innerHTML = htmlOutput;
            resultDiv.appendChild(resultItem);
        });
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Error fetching data. Please try again later.';
        errorDiv.style.display = 'block';
        console.error('Error:', error);
    }
}

// Reverse geocoding (coordinates to place name)
async function findPlace() {
    const latInput = document.getElementById('latInput').value.trim();
    const lonInput = document.getElementById('lonInput').value.trim();
    const resultDiv = document.getElementById('reverseResult');
    const loadingDiv = document.getElementById('reverseLoading');
    const errorDiv = document.getElementById('reverseError');

    // Clear previous results
    resultDiv.innerHTML = '';
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    // Validate inputs
    if (!latInput || !lonInput) {
        errorDiv.textContent = 'Please enter both latitude and longitude';
        errorDiv.style.display = 'block';
        return;
    }

    // Validate if inputs are numbers
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || isNaN(lon)) {
        errorDiv.textContent = 'Please enter valid numbers for latitude and longitude';
        errorDiv.style.display = 'block';
        return;
    }

    // Validate coordinates ranges
    if (lat < -90 || lat > 90) {
        errorDiv.textContent = 'Latitude must be between -90 and 90 degrees';
        errorDiv.style.display = 'block';
        return;
    }

    if (lon < -180 || lon > 180) {
        errorDiv.textContent = 'Longitude must be between -180 and 180 degrees';
        errorDiv.style.display = 'block';
        return;
    }

    loadingDiv.style.display = 'block';

    try {
        // Using OpenStreetMap Nominatim API for reverse geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const data = await response.json();

        loadingDiv.style.display = 'none';

        if (data.error) {
            errorDiv.textContent = data.error || 'No location found for these coordinates';
            errorDiv.style.display = 'block';
            return;
        }

        resultDiv.style.display = 'block';

        // Format the location results
        const locationItem = document.createElement('div');
        locationItem.className = 'result-item';

        // Format the coordinates
        const latDeg = Math.abs(lat).toFixed(4) + "° " + (lat >= 0 ? "N" : "S");
        const lonDeg = Math.abs(lon).toFixed(4) + "° " + (lon >= 0 ? "E" : "W");

        // Get address components
        const address = data.address;
        const addressComponents = [];

        // Build address components list
        if (address.road) addressComponents.push(`<strong>Street:</strong> ${address.road}`);
        if (address.house_number) addressComponents.push(`<strong>Number:</strong> ${address.house_number}`);
        if (address.suburb) addressComponents.push(`<strong>Suburb:</strong> ${address.suburb}`);
        if (address.city || address.town || address.village) {
            const city = address.city || address.town || address.village;
            addressComponents.push(`<strong>City/Town:</strong> ${city}`);
        }
        if (address.county) addressComponents.push(`<strong>County:</strong> ${address.county}`);
        if (address.state) addressComponents.push(`<strong>State:</strong> ${address.state}`);
        if (address.country) addressComponents.push(`<strong>Country:</strong> ${address.country}`);
        if (address.postcode) addressComponents.push(`<strong>Postcode:</strong> ${address.postcode}`);

        // Format the output text for copying
        const formattedOutput = `Location found for coordinates [${lat.toFixed(4)}, ${lon.toFixed(4)}]:
📍 **${data.display_name}**`;

        // Create HTML output
        const htmlOutput = `
                    <div class="location-box">
                        <div class="location-title">${data.display_name}</div>
                        <div class="location-details">
                            ${addressComponents.length > 0 ? addressComponents.join('<br>') : 'No detailed address information available'}
                        </div>
                        <div class="location-coordinates">
                            <strong>Coordinates:</strong> ${latDeg}, ${lonDeg} (${lat.toFixed(4)}, ${lon.toFixed(4)})
                        </div>
                    </div>
                    <div>
                        <button class="copy-btn" onclick="copyToClipboard(\`${formattedOutput}\`)">Copy Result</button>
                        <button class="switch-button" onclick="switchToForwardWithPlace('${data.display_name}')">Search this place name</button>
                    </div>
                `;

        locationItem.innerHTML = htmlOutput;
        resultDiv.appendChild(locationItem);

    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Error fetching data. Please try again later.';
        errorDiv.style.display = 'block';
        console.error('Error:', error);
    }
}

// Event listeners for Enter key
document.getElementById('placeInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        findCoordinates();
    }
});

document.getElementById('latInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        findPlace();
    }
});

document.getElementById('lonInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        findPlace();
    }
});