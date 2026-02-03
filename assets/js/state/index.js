/**
 * State Management - Barrel Export
 * Application state management modules
 */

// UI State Manager
export { UIStateManager } from './ui-state-manager.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // UIStateManager class is already exported to window by the manager file
    // This index.js ensures it's also accessible via ES6 imports
}
