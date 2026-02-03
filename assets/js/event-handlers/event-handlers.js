/**
 * Event Handlers Module - Main Coordinator
 * Coordinates all event handler submodules
 * Refactored into modular structure for better separation of concerns
 */

class EventHandlers {
    constructor(config) {
        this.config = config;

        // Initialize submodules
        this.dataHandlers = new DataEventHandlers(config);
        this.catalogHandlers = new CatalogEventHandlers(config);
        this.analysisHandlers = new AnalysisEventHandlers(config);
        this.measurementHandlers = new MeasurementEventHandlers(config);
        this.toolsHandlers = new ToolsEventHandlers(config);
    }

    initialize() {
        // Initialize all submodules
        this.dataHandlers.initialize();
        this.catalogHandlers.initialize();
        this.analysisHandlers.initialize();
        this.measurementHandlers.initialize();
        this.toolsHandlers.initialize();
    }
}

// Make it globally available
window.EventHandlers = EventHandlers;
