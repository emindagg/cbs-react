/**
 * Sidebar Components - Barrel Export
 * Sidebar templates and related components
 */

export { SidebarTemplates } from './templates.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
