// window1.js

export async function initializeWindow1() {
    const window1 = document.getElementById('window1');
    if (!window1) {
        console.error('Element with id "window1" not found.');
        return;
    }

    // Clear the content or set initial placeholder content
    window1.innerHTML = '<p>Loading resort details...</p>';

    // Example initialization logic can go here
    console.log('Window1 initialized.');
}

export async function displayResortDetails(resortName) {
    const window1 = document.getElementById('window1');
    try {        
        const response = await fetch(`http://127.0.0.1:5000/api/resort/${encodeURIComponent(resortName)}`);
        if (!response.ok) throw new Error('Failed to fetch resort details');
        const data = await response.json();

        if (data.status === "success") {
            const resort = data.data;
            window1.innerHTML = `
                <h2>${resort.display_name}</h2>
                <p><strong>Open Lifts:</strong> ${resort.open_lifts} / ${resort.total_lifts}</p>
                <p><strong>Snow Depth (Mountain):</strong> ${resort.snow_mountain}</p>
                <p><strong>Snow Depth (Valley):</strong> ${resort.snow_valley}</p>
                <p><strong>Latitude:</strong> ${resort.latitude}</p>
                <p><strong>Longitude:</strong> ${resort.longitude}</p>
            `;
        } else {
            window1.textContent = 'Resort details not found.';
        }
    } catch (error) {
        console.error('Error fetching resort details:', error);
        window1.textContent = 'Failed to load resort details.';
    }
}
