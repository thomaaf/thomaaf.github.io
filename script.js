// script.js

import { initializeMenu } from './menu.js';
import { initializeWindow1 } from './window1.js';
import { initializeWindow2 } from './window2.js';
import { initializeWindow3 } from './window3.js';
import { initializeWindow4 } from './window4.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    initializeWindow1();
    initializeWindow2();

    // Initialize the map and pass it to window3
    const map = initializeWindow4();
    initializeWindow3(map);

    // Set up event delegation for communication between components
    setupGlobalEventListeners();
});

// Function to set up global event listeners for cross-window interactions
function setupGlobalEventListeners() {
    // Listen for custom events from window3 (e.g., table row clicks)
    document.addEventListener('resortSelected', (event) => {
        const resortName = event.detail.resortName;
        if (resortName) {
            import('./window1.js').then(module => {
                module.displayResortDetails(resortName);
            });
        }
    });

    // Listen for map marker clicks from window4
    document.addEventListener('mapMarkerClicked', (event) => {
        const resortName = event.detail.resortName;
        if (resortName) {
            import('./window1.js').then(module => {
                module.displayResortDetails(resortName);
            });
        }
    });
}
