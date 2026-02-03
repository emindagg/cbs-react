/**
 * Performance Utilities
 * Provides throttle and debounce functions to optimize event handlers
 */

(function() {
    'use strict';
    
    /**
     * Throttle function - limits execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} wait - Minimum time between executions (ms)
     * @returns {Function} Throttled function
     */
    function throttle(func, wait = 100) {
        let timeout = null;
        let previous = 0;
        
        return function(...args) {
            const now = Date.now();
            const remaining = wait - (now - previous);
            
            if (remaining <= 0 || remaining > wait) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
                previous = now;
                func.apply(this, args);
            } else if (!timeout) {
                timeout = setTimeout(() => {
                    previous = Date.now();
                    timeout = null;
                    func.apply(this, args);
                }, remaining);
            }
        };
    }
    
    /**
     * Debounce function - delays execution until after wait time
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time (ms)
     * @returns {Function} Debounced function
     */
    function debounce(func, wait = 150) {
        let timeout;
        
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, wait);
        };
    }
    
    /**
     * RequestAnimationFrame throttle - executes on next frame
     * @param {Function} func - Function to throttle
     * @returns {Function} RAF-throttled function
     */
    function rafThrottle(func) {
        let rafId = null;
        
        return function(...args) {
            if (rafId) return;
            
            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                rafId = null;
            });
        };
    }
    
    // Export to global scope
    window.performanceUtils = {
        throttle,
        debounce,
        rafThrottle
    };
    
})();
