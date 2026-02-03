/**
 * Features - Barrel Export
 * Advanced features and special functionality modules
 */

// Timeline - Temporal data visualization
export { Timeline } from './timeline/timeline.js';

// Astronomy - Celestial calculations and visualization
export { AstroGlobe } from './astronomy/astro-globe.js';

// Globe View - 3D globe visualization
export { GlobeView } from './globe-view/globe-view.js';

// Catalog - Data catalog management (to be implemented)
// export { CatalogLoader } from './catalog/catalog-loader.js';
// export { CatalogRenderer } from './catalog/catalog-renderer.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
