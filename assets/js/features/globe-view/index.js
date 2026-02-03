/**
 * Globe View Feature - Barrel Export
 * 3D globe visualization and interaction
 */

export { GlobeView } from './globe-view.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // GlobeView class is already exported to window by globe-view.js
    // This index.js ensures it's also accessible via ES6 imports
}
