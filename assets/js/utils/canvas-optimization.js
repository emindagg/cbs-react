/**
 * Canvas Event Optimization
 * Optimizes MapLibre canvas interactions for better INP scores
 */

(function() {
    'use strict';
    
    /**
     * Optimize MapLibre canvas events
     * @param {maplibregl.Map} map - MapLibre map instance
     */
    function optimizeCanvasEvents(map) {
        if (!map) {
            Logger.warn('Canvas optimization: No map instance provided');
            return;
        }
        
        const canvas = map.getCanvas();
        if (!canvas) return;
        
        // Disable default passive event listeners on canvas
        // This prevents browser from waiting for event to finish before scrolling
        const originalAddEventListener = canvas.addEventListener;
        canvas.addEventListener = function(type, listener, options) {
            // Make touch/wheel events passive by default
            if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' || type === 'mousewheel') {
                if (typeof options === 'boolean') {
                    options = { capture: options, passive: true };
                } else if (typeof options === 'object') {
                    options.passive = true;
                } else {
                    options = { passive: true };
                }
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
        
    }
    
    /**
     * Debounce map render events
     * @param {maplibregl.Map} map - MapLibre map instance
     */
    function optimizeMapRendering(map) {
        if (!map) return;
        
        // Reduce render frequency during pan/zoom
        let renderTimeout;
        const originalSetStyle = map.setStyle;
        
        map.setStyle = function(...args) {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                originalSetStyle.apply(this, args);
            }, 16); // ~60fps
        };
    }
    
    /**
     * Initialize all canvas optimizations
     * @param {maplibregl.Map} map - MapLibre map instance
     */
    function initialize(mapInstance) {
        // Handle both direct map instance and {map, config} wrapper
        const map = mapInstance?.map || mapInstance;
        
        if (!map || typeof map.getCanvas !== 'function') {
            // Retry after map loads
            if (typeof window !== 'undefined') {
                const checkMap = setInterval(() => {
                    if (window.map) {
                        clearInterval(checkMap);
                        initialize(window.map);
                    }
                }, 100);
            }
            return;
        }
        
        // Wait for map to be fully loaded
        if (map.isStyleLoaded && !map.isStyleLoaded()) {
            map.once('load', () => {
                optimizeCanvasEvents(map);
                optimizeMapRendering(map);
            });
        } else {
            optimizeCanvasEvents(map);
            optimizeMapRendering(map);
        }
    }
    
    // Export
    window.canvasOptimization = {
        initialize,
        optimizeCanvasEvents,
        optimizeMapRendering
    };
    
    // Auto-initialize if map exists
    if (typeof window !== 'undefined' && window.map) {
        initialize(window.map);
    }
    
})();
