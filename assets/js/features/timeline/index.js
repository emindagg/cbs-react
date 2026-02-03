/**
 * Timeline Feature - Barrel Export
 * Temporal data visualization and time-based analysis
 */

export { Timeline } from './timeline.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // Timeline class is already exported to window by timeline.js
    // This index.js ensures it's also accessible via ES6 imports
}
