/**
 * Modal Components - Barrel Export
 * Modal and dialog management components
 */

export { ModalManager } from './dialog-manager.js';
export { ProgressModal } from './progress-modal.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // These classes are already exported to window by their respective modules
    // This index.js ensures they're also accessible via ES6 imports
}
