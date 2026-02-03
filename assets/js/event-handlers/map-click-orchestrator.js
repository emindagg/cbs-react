/**
 * Map Click Orchestrator
 * Centralized handler for all map click events to prevent duplicate handlers
 * and ensure proper priority-based routing
 */

// Güvenli Logger helper'larý
const safeLogOrch = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeWarnOrch = (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args);
const safeErrorOrch = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

(function() {
    'use strict';
    
    class MapClickOrchestrator {
        constructor(map) {
            this.map = map;
            this.handlers = [];
            this.layerHandlers = new Map(); // Layer-specific handlers
            this.isEnabled = false;
        }
        
        /**
         * Initialize the orchestrator with hybrid system:
         * - Layer-based handlers for fast feature clicks (GPU-accelerated)
         * - Global fallback handler for empty area clicks
         */

        initialize() {
            if (this.isEnabled) {
                safeWarnOrch('MapClickOrchestrator already initialized');
                return;
            }
            
            // Setup layer-based handlers first (faster)
            this.setupLayerHandlers();
            
            // Global fallback for empty area clicks
            this.map.on('click', (e) => this.handleGlobalClick(e));
            
            this.isEnabled = true;
        }
        
        /**
         * Setup layer-specific click handlers for performance
         */

        setupLayerHandlers() {
            // Add layer-specific handlers for geometries
            const geometryLayers = ['catalog-polygons', 'catalog-lines'];
            
            const trySetup = () => {
                let setupCount = 0;
                
                geometryLayers.forEach(layerId => {
                    const layer = this.map.getLayer(layerId);
                    if (layer) {
                        // Direct handler without throttle to preserve event object
                        const clickHandler = (e) => {
                            if (e.originalEvent) {
                                e.originalEvent._handledByLayer = true;
                            }
                            this.handleLayerClick(e, layerId);
                        };
                        
                        this.map.on('click', layerId, clickHandler);
                        setupCount++;
                    }
                });
                
                if (setupCount === 0) {
                    setTimeout(trySetup, 500);
                }
            };
            
            // Try setup after a short delay to ensure layers are added
            setTimeout(trySetup, 100);
        }
        
        /**
         * Handle layer-specific click (fast path)
         */

        handleLayerClick(e, layerId) {
            // Execute layer-specific handlers
            const layerHandlers = this.layerHandlers.get(layerId) || [];
            
            for (const handler of layerHandlers) {
                if (handler.canHandle(e)) {
                    handler.handle(e);
                    
                    if (handler.stopPropagation !== false) {
                        return;
                    }
                }
            }
        }
        
        /**
         * Handle global click event (fallback for empty areas)
         */

        handleGlobalClick(e) {
            // Skip if already handled by layer-specific handler
            if (e.originalEvent._handledByLayer) {
                return;
            }
            
            // Execute handlers in priority order (highest first)
            for (const handler of this.handlers) {
                if (handler.canHandle(e)) {
                    handler.handle(e);
                    
                    // If handler wants to stop propagation, break
                    if (handler.stopPropagation !== false) {
                        return;
                    }
                }
            }
        }
        
        /**
         * Register a global click handler (for empty area clicks)
         * @param {Object} handler - Handler configuration
         * @param {number} handler.priority - Higher priority = executed first (100 = tools, 50 = drawing, 10 = data collection)
         * @param {Function} handler.canHandle - Function that returns true if this handler should process the click
         * @param {Function} handler.handle - Function that processes the click event
         * @param {boolean} handler.stopPropagation - If true (default), stops other handlers from executing
         * @param {string} handler.name - Handler name for debugging
         */

        registerHandler(handler) {
            if (!handler.canHandle || typeof handler.canHandle !== 'function') {
                safeErrorOrch('Handler must have canHandle function', handler);
                return;
            }
            
            if (!handler.handle || typeof handler.handle !== 'function') {
                safeErrorOrch('Handler must have handle function', handler);
                return;
            }
            
            // Set defaults
            handler.priority = handler.priority || 0;
            handler.stopPropagation = handler.stopPropagation !== false;
            handler.name = handler.name || 'anonymous';
            
            this.handlers.push(handler);
            
            // Sort by priority (descending)
            this.handlers.sort((a, b) => b.priority - a.priority);
        }
        
        /**
         * Register a layer-specific handler (faster than global)
         * @param {string} layerId - MapLibre layer ID
         * @param {Object} handler - Handler configuration
         */

        registerLayerHandler(layerId, handler) {
            if (!handler.handle || typeof handler.handle !== 'function') {
                safeErrorOrch('Handler must have handle function', handler);
                return;
            }
            
            // Set defaults
            handler.priority = handler.priority || 0;
            handler.stopPropagation = handler.stopPropagation !== false;
            handler.name = handler.name || 'anonymous';
            handler.canHandle = handler.canHandle || (() => true);
            
            // Get or create layer handler array
            if (!this.layerHandlers.has(layerId)) {
                this.layerHandlers.set(layerId, []);
            }
            
            const handlers = this.layerHandlers.get(layerId);
            handlers.push(handler);
            
            // Sort by priority (descending)
            handlers.sort((a, b) => b.priority - a.priority);
        }
        
        /**
         * Unregister a handler by name
         */

        unregisterHandler(name) {
            const index = this.handlers.findIndex(h => h.name === name);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        }
        
        /**
         * Get current handlers for debugging
         */

        getHandlers() {
            return this.handlers.map(h => ({
                name: h.name,
                priority: h.priority,
                stopPropagation: h.stopPropagation
            }));
        }
        
        /**
         * Clear all handlers
         */

        clearHandlers() {
            this.handlers = [];
        }
    }
    
    // Make it globally available
    window.MapClickOrchestrator = MapClickOrchestrator;
    
})();
