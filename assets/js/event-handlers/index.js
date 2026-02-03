/**
 * Event Handlers - Barrel Export
 * Central export point for all event handler modules
 */

// Main coordinator
export { EventHandlers } from './event-handlers.js';

// Submodules
export { DataEventHandlers } from './data-event-handlers.js';
export { CatalogEventHandlers } from './catalog-event-handlers.js';
export { AnalysisEventHandlers } from './analysis-event-handlers.js';
export { MeasurementEventHandlers } from './measurement-event-handlers.js';
export { ToolsEventHandlers } from './tools-event-handlers.js';

// Map interaction handlers
export { MapInteractions } from './map-interactions.js';
export { MapClickOrchestrator } from './map-click-orchestrator.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    window.EventHandlers = EventHandlers;
    window.DataEventHandlers = DataEventHandlers;
    window.CatalogEventHandlers = CatalogEventHandlers;
    window.AnalysisEventHandlers = AnalysisEventHandlers;
    window.MeasurementEventHandlers = MeasurementEventHandlers;
    window.ToolsEventHandlers = ToolsEventHandlers;
    window.MapInteractions = MapInteractions;
    window.MapClickOrchestrator = MapClickOrchestrator;
}
