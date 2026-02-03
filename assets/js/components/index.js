/**
 * UI Components - Barrel Export
 * Main UI component modules for the application
 */

// Core UI Manager
export { UIComponents } from './ui-manager.js';

// Modal Components
export { ModalManager } from './modals/dialog-manager.js';
export { ProgressModal } from './modals/progress-modal.js';

// Sidebar Components
export { SidebarTemplates } from './sidebar/templates.js';

// Labels Manager
export { Labels } from './labels-manager.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
