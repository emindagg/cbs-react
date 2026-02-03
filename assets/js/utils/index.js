/**
 * Utils - Barrel Export
 * Utility functions for the application
 */

// Main utilities
export * from './utils.js';
export * from './performance-utils.js';
export * from './canvas-optimization.js';

// Legacy: Import and re-export to window for backward compatibility
if (typeof window !== 'undefined') {
    // Utils modules typically add their functions directly to window
    // This index.js ensures they're still accessible via import
}
