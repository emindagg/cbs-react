/**
 * Module Initialization
 * Central orchestrator that wires all application modules together
 * Initializes modules using Dependency Injection Container
 * Part of the modularized initialization system
 */

// Use safe Logger wrapper (check if Logger is available before using)
const safeLog = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarn = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeError = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

/**
 * Initialize all application modules using DI Container
 * This is the main initialization function that sets up all modules
 * using the global ServiceLocator (DI Container)
 */
function initializeApplicationModules() {
    // Ensure window.map exists (created by map core initialization)
    if (!window.map) {
        safeError('❌ Map not initialized! Initialize map core first.');
        return false;
    }

    // Ensure ServiceLocator exists
    if (!window.ServiceLocator) {
        safeError('❌ ServiceLocator (DI Container) not initialized!');
        return false;
    }

    // Ensure global data structures exist
    window.userMarkers = window.userMarkers || [];
    window.catalogGeometryLayers = window.catalogGeometryLayers || [];
    window.measurements = window.measurements || [];

    const container = window.ServiceLocator;

    // ==========================================
    // MODULE INITIALIZATION USING DI CONTAINER
    // ==========================================

    try {
        // 1. Initialize UI Panels (sidebar, tools panel - must be first for UI structure)
        if (typeof initializeUIPanels === 'function') {
            initializeUIPanels();
            safeLog('✅ UI Panels initialized');
        } else {
            safeError('❌ initializeUIPanels not available');
            return false;
        }

        // 2. Get UI Components from DI Container
        if (container.has('uiComponents')) {
            window.uiComponents = container.get('uiComponents');
            window.uiComponents.initializeAll();
            safeLog('✅ UIComponents initialized from DI Container');
        } else {
            safeError('❌ UIComponents not registered in DI Container');
            return false;
        }

        // 3. Get Data Drawing from DI Container
        if (container.has('drawingManager')) {
            window.dataDrawing = container.get('drawingManager');
            safeLog('✅ DataDrawing initialized from DI Container');
        } else {
            safeError('❌ DrawingManager not registered in DI Container');
            return false;
        }

        // 4. Get Marker Manager from DI Container
        if (container.has('markerManager')) {
            window.markerManager = container.get('markerManager');
            safeLog('✅ MarkerManager initialized from DI Container');
        } else {
            safeError('❌ MarkerManager not registered in DI Container');
            return false;
        }

        // 5. Get Report Generation from DI Container
        if (container.has('reportGeneration')) {
            window.reportGeneration = container.get('reportGeneration');
            safeLog('✅ ReportGeneration initialized from DI Container');
        } else {
            safeWarn('⚠️ ReportGeneration not registered in DI Container');
        }

        // 6. Get Import/Export from DI Container
        if (container.has('importExport')) {
            window.importExport = container.get('importExport');
            safeLog('✅ ImportExport initialized from DI Container');
        } else {
            safeWarn('⚠️ ImportExport not registered in DI Container');
        }

        // 7. Get Event Handlers from DI Container
        if (container.has('eventHandlers')) {
            window.eventHandlers = container.get('eventHandlers');
            window.eventHandlers.initialize();
            safeLog('✅ EventHandlers initialized from DI Container');
        } else {
            safeError('❌ EventHandlers not registered in DI Container');
            return false;
        }
    } catch (error) {
        safeError('❌ Error during DI-based initialization:', error);
        return false;
    }

    // 8. Setup data list handlers
    if (typeof window.setupDataListHandlers === 'function') {
        window.setupDataListHandlers();
        safeLog('✅ Data list handlers setup');
    } else {
        safeError('❌ setupDataListHandlers not available');
    }

    // 9. Initialize Label Manager (delayed to ensure DOM is ready)
    setTimeout(() => {
        if (typeof window.initializeLabelManager === 'function') {
            window.initializeLabelManager();
        } else {
            safeWarn('⚠️ initializeLabelManager not available');
        }
    }, 500);

    // 10. Initialize measurement tools (delayed to ensure DOM and tools are ready)
    setTimeout(() => {
        if (typeof window.initializeMeasurementTools === 'function') {
            window.initializeMeasurementTools();
        } else {
            safeWarn('⚠️ initializeMeasurementTools not available');
        }
    }, 600);

    // 11. Initialize screenshot selection tool (delayed to ensure map is ready)
    setTimeout(() => {
        if (typeof window.initializeScreenshotTool === 'function') {
            window.initializeScreenshotTool();
        } else {
            safeWarn('⚠️ initializeScreenshotTool not available');
        }
    }, 700);

    safeLog('✅ All application modules initialized successfully');
    return true;
}

// Make function globally available
window.initializeApplicationModules = initializeApplicationModules;
