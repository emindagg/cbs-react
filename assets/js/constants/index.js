/**
 * Constants - Barrel Export
 * Application constants and configuration data
 */

// Configuration constants
export * from './map-config.js';
export { turkeyProvinces } from './turkey-provinces.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // Constants are typically defined as plain objects/arrays
    // They're already exported to window by their modules
}
