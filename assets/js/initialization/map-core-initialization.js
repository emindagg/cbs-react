/**
 * Map Core Initialization Module
 * Creates the MapLibre GL JS map instance and sets up basic controls
 * Part of the modularized initialization system
 */

/**
 * Initialize map core
 * Creates map instance using map-config.js
 * Sets up zoom buttons and projection
 */
function initializeMapCore() {
    // Initialize map using map-config.js
    const { map, config } = initializeMap('map');
    window.map = map;
    window.MapConfig = config;

    // Globe görünümünü style yüklendiğinde hazırla
    map.on('style.load', () => {
        // Globe projection destekleniyorsa hazırla
        if (typeof map.setProjection === 'function') {
            // Globe projection can be enabled via globe-view.js
        }
    });

    // Custom zoom butonlarını bağla
    const zoomInButton = document.getElementById('zoom-in-button');
    const zoomOutButton = document.getElementById('zoom-out-button');
    if (zoomInButton) {
        zoomInButton.addEventListener('click', function () {
            window.map.zoomIn();
        });
    }
    if (zoomOutButton) {
        zoomOutButton.addEventListener('click', function () {
            window.map.zoomOut();
        });
    }

    if (window.Logger && typeof window.Logger.log === 'function') {
        window.Logger.log('✅ Map core initialized');
    } else {
        console.log('✅ Map core initialized');
    }
    return map;
}

// Make it globally available
window.initializeMapCore = initializeMapCore;
