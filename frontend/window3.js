export async function initializeWindow3(map) {
    if (!map) {
        console.error('Map is not initialized!');
        return;
    }

    const resortList = document.getElementById('resortTable');

    // Create the table structure
    const table = document.createElement('table');
    table.id = 'resortTable';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    tbody.id = 'resortTableBody';

    // Create header row
    const headers = ['Name', 'Open Lifts', 'Total Lifts', 'Placeholder 1', 'Placeholder 2'];
    const headerRow = document.createElement('tr');

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;

        // Make headers sortable
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => sortTableByColumn(table, headers.indexOf(headerText)));
        
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);
    table.appendChild(tbody);
    resortList.appendChild(table);

    // Fetch resort data once
    let allResorts = [];
    try {
        const response = await fetch('http://127.0.0.1:5000/api/resorts');
        if (!response.ok) throw new Error('Failed to fetch resorts data');

        const data = await response.json();
        allResorts = data.data;

        // Initial table population based on the current map view
        updateTableBasedOnMap(allResorts, map, tbody);

        // Add event listener to dynamically update the list on map movement
        map.on('moveend', () => updateTableBasedOnMap(allResorts, map, tbody));
    } catch (error) {
        console.error('Error loading resorts:', error);
        resortList.textContent = 'Failed to load resorts.';
    }
}

// Function to update the table based on resorts visible on the map
function updateTableBasedOnMap(resorts, map, tbody) {
    if (!map || !map.getBounds) {
        console.error('Map is not defined or not fully initialized.');
        return;
    }

    const bounds = map.getBounds(); // Get the current map view bounds

    // Filter resorts that are within the current map view
    const visibleResorts = resorts.filter(resort => {
        return (
            resort.latitude &&
            resort.longitude &&
            bounds.contains([resort.latitude, resort.longitude])
        );
    });

    // Populate the table with visible resorts
    populateTable(visibleResorts, tbody);
}

// Function to populate the table body
function populateTable(resorts, tbody) {
    tbody.innerHTML = ''; // Clear existing rows

    resorts.forEach(resort => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = resort.display_name;
        nameCell.style.cursor = 'pointer';
        nameCell.addEventListener('click', () => {
            import('./window1.js').then(module => {
                module.displayResortDetails(resort.display_name);
            });
        });

        const openLiftsCell = document.createElement('td');
        openLiftsCell.textContent = resort.open_lifts || '-';

        const totalLiftsCell = document.createElement('td');
        totalLiftsCell.textContent = resort.total_lifts || '-';

        row.appendChild(nameCell);
        row.appendChild(openLiftsCell);
        row.appendChild(totalLiftsCell);

        tbody.appendChild(row);
    });
}


// Function to sort the table by column
function sortTableByColumn(table, columnIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const isNumericColumn = ['Open Lifts', 'Total Lifts'].includes(
        table.querySelector('thead th:nth-child(' + (columnIndex + 1) + ')').textContent
    );

    // Toggle the sorting order
    const currentSortOrder = tbody.getAttribute('data-sort-order') || 'asc';
    const newSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    tbody.setAttribute('data-sort-order', newSortOrder);

    rows.sort((rowA, rowB) => {
        const cellA = rowA.children[columnIndex].textContent.trim();
        const cellB = rowB.children[columnIndex].textContent.trim();

        if (isNumericColumn) {
            return newSortOrder === 'asc'
                ? Number(cellA || 0) - Number(cellB || 0)
                : Number(cellB || 0) - Number(cellA || 0);
        }

        return newSortOrder === 'asc'
            ? cellA.localeCompare(cellB)
            : cellB.localeCompare(cellA);
    });

    // Reorder the rows in the DOM
    rows.forEach(row => tbody.appendChild(row));
}
