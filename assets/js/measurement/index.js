/**
 * Measurement Tools - Barrel Export
 * Tools for measuring distances and areas on the map
 */

// Measurement modules
export { DistanceMeasurement } from './distance-measurement.js';
export { AreaMeasurement } from './area-measurement.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // Check if modules define their own window exports
    // If not, we'll need to import and export them
    // For now, rely on modules' own window assignments
}
