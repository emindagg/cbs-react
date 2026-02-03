/**
 * Orchestrator Initialization Module
 * Initializes MapClickOrchestrator, Timeline Manager, and AstroGlobe
 * Part of the modularized initialization system
 */

// Safe Logger helpers
const safeLogOrchInit = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnOrchInit = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorOrchInit = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

/**
 * Initialize map click orchestrator
 * Prevents duplicate click event listeners on the map
 * Centralizes all map click handling through a single orchestrator
 */
function initializeMapClickOrchestrator() {
    if (!window.map) {
        safeErrorOrchInit('Map not initialized');
        return;
    }

    if (typeof MapClickOrchestrator !== 'undefined') {
        window.mapClickOrchestrator = new MapClickOrchestrator(window.map);
        window.mapClickOrchestrator.initialize();
        safeLogOrchInit('✅ MapClickOrchestrator initialized');
    } else {
        safeWarnOrchInit('MapClickOrchestrator not available - map clicks may have conflicts');
    }
}

/**
 * Initialize Timeline Manager
 * Handles temporal data visualization and filtering
 */
function initializeTimelineManager() {
    if (!window.map) {
        safeErrorOrchInit('Map not initialized');
        return;
    }

    if (typeof initializeTimeline !== 'undefined') {
        initializeTimeline(window.map);
        safeLogOrchInit('✅ Timeline Manager initialized');
    } else {
        safeWarnOrchInit('Timeline Manager not available');
    }
}

/**
 * Initialize Astronomy Globe Module
 * Provides astronomical visualizations and celestial object tracking
 * Uses polling to wait for AstroGlobe module to be available
 */
function initializeAstroGlobeModule() {
    if (!window.map) {
        safeErrorOrchInit('Map not initialized');
        return;
    }

    // Internal function that polls for AstroGlobe availability
    function tryInitializeAstroGlobe() {
        if (typeof window.AstroGlobe !== 'undefined' && window.map) {
            if (window.map.isStyleLoaded()) {
                window.AstroGlobe.initialize(window.map);
                safeLogOrchInit('✅ AstroGlobe initialized');
            } else {
                window.map.once('style.load', () => {
                    window.AstroGlobe.initialize(window.map);
                    safeLogOrchInit('✅ AstroGlobe initialized');
                });
            }
        } else {
            // Module not yet loaded, retry after short delay
            setTimeout(tryInitializeAstroGlobe, 100);
        }
    }

    // Start initialization after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(tryInitializeAstroGlobe, 500);
        });
    } else {
        setTimeout(tryInitializeAstroGlobe, 500);
    }
}

/**
 * Initialize all orchestrators
 * Call this function after map is loaded
 */
function initializeOrchestrators() {
    initializeMapClickOrchestrator();
    initializeTimelineManager();
    initializeAstroGlobeModule();
    safeLogOrchInit('✅ All orchestrators initialized');
}

// Make functions globally available
window.initializeMapClickOrchestrator = initializeMapClickOrchestrator;
window.initializeTimelineManager = initializeTimelineManager;
window.initializeAstroGlobeModule = initializeAstroGlobeModule;
window.initializeOrchestrators = initializeOrchestrators;
