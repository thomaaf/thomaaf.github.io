export function initializeWindow4() {
    const mapContainer = document.getElementById('map');

    // Avoid initializing the map multiple times
    if (mapContainer._leaflet_id) {
        return L.map(mapContainer); // Return the already initialized map
    }

    const map = L.map(mapContainer).setView([47.269212, 11.404102], 13); // Innsbruck coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch resorts and add markers
    fetch('http://127.0.0.1:5000/api/resorts')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch resorts data');
            return response.json();
        })
        .then(data => {
            data.data.forEach(resort => {
                if (resort.latitude && resort.longitude) {
                    const marker = L.marker([resort.latitude, resort.longitude])
                        .addTo(map)
                        .bindPopup(`<strong>${resort.display_name}</strong>`);

                    marker.on('click', () => {
                        import('./window1.js').then(module => {
                            module.displayResortDetails(resort.display_name);
                        });
                    });
                }
            });
        })
        .catch(error => console.error('Error loading map resorts:', error));

    return map; // Return the map object
}



