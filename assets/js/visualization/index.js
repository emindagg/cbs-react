/**
 * Visualization - Barrel Export
 * Data visualization system (choropleth, bubble, dot density maps)
 */

// Main visualization components
// Note: Will be further modularized in future refactoring
// Current structure:
// - visualization-manager.js: Core visualization manager
// - visualization-wizard.js: Interactive visualization wizard
// - visualization-handlers.js: Event handlers for visualizations

export { VisualizationManager } from './visualization-manager.js';
// Note: visualization-wizard and visualization-handlers are loaded separately for now

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // VisualizationManager is already exported to window by manager file
    // Wizard and handlers are standalone modules that set their own window exports
}
