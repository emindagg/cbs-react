/**
 * Initialization - Barrel Export
 * Application initialization and bootstrap modules
 */

// Bootstrap and initialization
export { AppBootstrap } from './app-bootstrap.js';
export { AppInit } from './app-init.js';

// State initialization
export { StateInitialization } from './state-initialization.js';

// Map initialization
export { MapCoreInitialization } from './map-core-initialization.js';
export { MapSourcesInitialization } from './map-sources-initialization.js';
export { MapLayersInitialization } from './map-layers-initialization.js';

// UI initialization
export { UIPanelsInitialization } from './ui-panels-initialization.js';

// Module initialization
export { ModuleInitialization } from './module-initialization.js';

// Orchestrator initialization
export { OrchestratorInitialization } from './orchestrator-initialization.js';

// Managers
export { DataListManager } from './data-list-manager.js';
export { MeasurementsManager } from './measurements-manager.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
