/**
 * Astronomy Feature - Barrel Export
 * Astronomical calculations and celestial visualization
 */

export { AstroGlobe } from './astro-globe.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // AstroGlobe class is already exported to window by astro-globe.js
    // This index.js ensures it's also accessible via ES6 imports
}
