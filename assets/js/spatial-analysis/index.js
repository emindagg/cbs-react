/**
 * Spatial Analysis - Barrel Export
 * Geospatial analysis tools and algorithms
 */

// Main spatial analysis manager
// Note: Individual analysis methods will be extracted in future refactoring
// Current structure: All functionality in spatial-analysis-manager.js
export { SpatialAnalysis } from './spatial-analysis-manager.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // SpatialAnalysis class is already exported to window by the manager file
}
