/**
 * Application Bootstrap
 * Main bootstrap orchestrator that initializes all application modules
 *
 * This is a lightweight wrapper that calls modular initialization functions.
 * All actual bootstrap logic is in /assets/js/initialization/ modules.
 *
 * Bootstrap Dependencies (must be loaded before this file):
 * - data-list-manager.js (provides updateDataList, setupDataListHandlers)
 * - measurements-manager.js (provides clearAllMeasurements, initializeLabelManager, initializeMeasurementTools)
 * - module-initialization.js (provides initializeApplicationModules)
 *
 * Bootstrap Order:
 * 1. Wait for DOM to be ready
 * 2. Call initializeApplicationModules() which orchestrates everything
 */

(function () {
    'use strict';

    // Safe Logger wrapper
    const safeLogBootstrap = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
    const safeErrorBootstrap = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);
    const safeWarnBootstrap = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);

    // Track if bootstrap has been called
    let bootstrapAttempted = false;
    let bootstrapSucceeded = false;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startBootstrap);
    } else {
        startBootstrap();
    }

    function startBootstrap() {
        // Prevent duplicate bootstrap
        if (bootstrapAttempted) return;
        bootstrapAttempted = true;

        // Try bootstrap immediately
        tryBootstrap();

        // Also set up fallback retries in case dependencies aren't ready
        setTimeout(() => { if (!bootstrapSucceeded) tryBootstrap(); }, 100);
        setTimeout(() => { if (!bootstrapSucceeded) tryBootstrap(); }, 300);
        setTimeout(() => { if (!bootstrapSucceeded) tryBootstrap(); }, 500);
        setTimeout(() => { if (!bootstrapSucceeded) tryBootstrap(); }, 1000);
        setTimeout(() => { if (!bootstrapSucceeded) tryBootstrap(); }, 2000);
    }

    function tryBootstrap() {
        // Already succeeded, skip
        if (bootstrapSucceeded) return;

        // Check if required functions are available
        const missingDeps = [];

        if (typeof window.updateDataList !== 'function') {
            missingDeps.push('updateDataList');
        }
        if (typeof window.setupDataListHandlers !== 'function') {
            missingDeps.push('setupDataListHandlers');
        }
        if (typeof window.clearAllMeasurements !== 'function') {
            missingDeps.push('clearAllMeasurements');
        }
        if (typeof window.initializeLabelManager !== 'function') {
            missingDeps.push('initializeLabelManager');
        }
        if (typeof window.initializeMeasurementTools !== 'function') {
            missingDeps.push('initializeMeasurementTools');
        }
        if (typeof window.initializeApplicationModules !== 'function') {
            missingDeps.push('initializeApplicationModules');
        }

        if (missingDeps.length > 0) {
            safeWarnBootstrap(`⏳ Bootstrap waiting for dependencies: ${missingDeps.join(', ')}`);
            return; // Will retry via setTimeout
        }

        // All dependencies available, proceed with bootstrap
        bootstrap();
    }

    function bootstrap() {
        // Already succeeded, skip
        if (bootstrapSucceeded) return;

        safeLogBootstrap('🚀 Starting application bootstrap...');

        // Wait for map to load (services are registered in map 'load' event)
        waitForMapLoad().then(() => {
            // All prerequisites are available, initialize the application
            const success = window.initializeApplicationModules();

            if (success) {
                bootstrapSucceeded = true;
                safeLogBootstrap('✅ Application bootstrap complete (modular)');
            } else {
                safeErrorBootstrap('❌ Application bootstrap failed');
            }
        }).catch((error) => {
            safeErrorBootstrap('❌ Failed to wait for map load:', error);
        });
    }

    // Wait for map to be loaded (services are registered in map 'load' event)
    function waitForMapLoad() {
        return new Promise((resolve, reject) => {
            // Check if map exists
            if (!window.map) {
                // Wait for map to be created (max 10 seconds)
                let attempts = 0;
                const maxAttempts = 100;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.map) {
                        clearInterval(checkInterval);
                        // Map exists, now check if it's loaded
                        if (window.map.loaded()) {
                            resolve();
                        } else {
                            window.map.once('load', resolve);
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Map not created after 10 seconds'));
                    }
                }, 100);
            } else {
                // Map exists, check if it's loaded
                if (window.map.loaded()) {
                    // Map already loaded, wait a bit for service registration to complete
                    setTimeout(resolve, 100);
                } else {
                    // Wait for map load event, then wait a bit more for service registration
                    window.map.once('load', () => {
                        setTimeout(resolve, 100);
                    });
                }
            }
        });
    }
})();

