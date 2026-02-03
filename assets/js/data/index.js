/**
 * Data Management - Barrel Export
 * Core data management modules for markers, drawings, and data operations
 */

// Core data modules
export { DataManager } from './data-manager.js';
export { MarkerManager } from './marker-manager.js';
export { DataDrawing } from './drawing-manager.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
