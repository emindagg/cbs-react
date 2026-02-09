/**
 * Utility Functions Module
 * Consolidated utilities for the application
 * Merged from utils-core.js and utils.js
 */

(function(window) {
    'use strict';

    // ========================================
    // CORE UTILITIES (from utils-core.js)
    // ========================================

    /**
     * Show feedback message to user
     * @param {string} message - Message to display
     * @param {string} type - Message type: 'success', 'error', 'info', 'warning' (default: 'success')
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    window.showFeedback = function(message, type = 'success', duration = 3000) {
        const bgColors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        const feedback = document.createElement('div');
        feedback.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColors[type] || bgColors.success} text-white px-5 py-2.5 rounded-lg shadow-lg z-[3000] pointer-events-none transition-all duration-300 text-sm`;
        feedback.textContent = message;
        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 300);
        }, duration);
    };

    /**
     * Show educational feedback message
     * Uses UIComponents if available, otherwise shows as info feedback
     * @param {string} message - Educational message to display
     */
    window.showEducationalFeedback = function(message) {
        // If UIComponents is initialized, use its educational feedback system
        if (window.uiComponents && typeof window.uiComponents.showEducationalFeedback === 'function') {
            window.uiComponents.showEducationalFeedback(message);
        } else {
            // Fallback to regular feedback
            window.showFeedback(message, 'info', 4000);
        }
    };

    /**
     * Format distance with appropriate units (meters or kilometers)
     * @param {number} meters - Distance in meters
     * @returns {string} Formatted distance string
     */
    window.formatDistance = function(meters) {
        if (typeof meters !== 'number' || isNaN(meters)) {
            return '–';
        }

        if (meters < 1000) {
            return `${Math.round(meters).toLocaleString('tr-TR')} m`;
        }

        const km = meters / 1000;
        const decimals = km >= 100 ? 0 : 2;
        return `${km.toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })} km`;
    };

    /**
     * Format area with appropriate units
     * @param {number} squareMeters - Area in square meters
     * @returns {string} Formatted area string
     */
    window.formatArea = function(squareMeters) {
        if (typeof squareMeters !== 'number' || isNaN(squareMeters)) {
            return '–';
        }

        if (squareMeters < 10000) {
            return `${Math.round(squareMeters).toLocaleString('tr-TR')} m²`;
        }

        const km2 = squareMeters / 1000000;
        const decimals = km2 >= 100 ? 0 : 2;
        return `${km2.toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })} km²`;
    };

    /**
     * Format number with Turkish locale
     * @param {number} value - Number to format
     * @param {number} decimals - Number of decimal places (default: 0)
     * @param {string} unit - Unit suffix (optional)
     * @returns {string} Formatted number string
     */
    window.formatNumber = function(value, decimals = 0, unit = '') {
        if (typeof value !== 'number' || isNaN(value)) {
            return '–';
        }

        const formatted = value.toLocaleString('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });

        return unit ? `${formatted} ${unit}` : formatted;
    };

    /**
     * Remove Turkish thousand separators from string
     * @param {string} str - String with thousand separators
     * @returns {string} Clean number string
     */
    window.unformatNumber = function(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/\./g, '');
    };

    /**
     * Check if element is hidden
     * @param {HTMLElement} el - Element to check
     * @returns {boolean} True if hidden
     */
    window.isElementHidden = function(el) {
        if (!el) return true;
        const cs = window.getComputedStyle(el);
        return cs && cs.display === 'none';
    };

    /**
     * Safely get localStorage item
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Stored value or default
     */
    window.getStorageItem = function(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            Logger.warn('localStorage access denied:', e);
            return defaultValue;
        }
    };

    /**
     * Safely set localStorage item
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    window.setStorageItem = function(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            Logger.warn('localStorage access denied:', e);
            return false;
        }
    };

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    window.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Calculate map scale based on zoom level
     * @param {number} zoom - Current zoom level
     * @returns {number} Scale denominator
     */
    window.calculateMapScale = function(zoom) {
        return Math.round(591657527.591555 / Math.pow(2, zoom));
    };

    /**
     * Format coordinates for display
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} precision - Decimal places (default: 5)
     * @returns {string} Formatted coordinates
     */
    window.formatCoordinates = function(lat, lng, precision = 5) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return '–';
        }
        return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
    };

    /**
     * Create a unique ID
     * @param {string} prefix - Optional prefix
     * @returns {string} Unique ID
     */
    window.generateId = function(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    /**
     * Wait for condition to be true
     * @param {Function} condition - Function that returns boolean
     * @param {number} timeout - Maximum wait time in ms (default: 5000)
     * @param {number} interval - Check interval in ms (default: 100)
     * @returns {Promise<boolean>} Resolves when condition is true or timeout
     */
    window.waitFor = function(condition, timeout = 5000, interval = 100) {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const check = () => {
                if (condition()) {
                    resolve(true);
                } else if (Date.now() - startTime >= timeout) {
                    resolve(false);
                } else {
                    setTimeout(check, interval);
                }
            };

            check();
        });
    };

    // ========================================
    // EXTENDED UTILITIES (from utils.js)
    // ========================================

    /**
     * Download file to user's computer
     * @param {string} content - File content
     * @param {string} fileName - Name of the file
     * @param {string} mimeType - MIME type of the file
     */
    window.downloadFile = function(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
    };

    /**
     * Make an element draggable
     * @param {HTMLElement} element - Element to make draggable
     * @returns {Object} Object with wasDragged method
     */
    window.makeDraggable = function(element) {
        let isDragging = false;
        let dragStartX = 0, dragStartY = 0;
        let clickStartX = 0, clickStartY = 0;
        let initialRight, initialBottom;

        element.addEventListener('mousedown', function(e) {
            isDragging = false;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            clickStartX = e.clientX;
            clickStartY = e.clientY;

            const rect = element.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialBottom = window.innerHeight - rect.bottom;
        });

        const mouseMoveHandler = function(e) {
            const deltaX = dragStartX - e.clientX;
            const deltaY = dragStartY - e.clientY;

            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                isDragging = true;
                element.style.cursor = 'grabbing';
            }

            if (!isDragging) return;

            const newRight = initialRight + deltaX;
            const newBottom = initialBottom + deltaY;

            const minRight = 10;
            const minBottom = 10;
            const maxRight = window.innerWidth - element.offsetWidth - 10;
            const maxBottom = window.innerHeight - element.offsetHeight - 10;

            element.style.right = Math.max(minRight, Math.min(newRight, maxRight)) + 'px';
            element.style.bottom = Math.max(minBottom, Math.min(newBottom, maxBottom)) + 'px';

            e.preventDefault();
        };

        const mouseUpHandler = function() {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = element.tagName === 'BUTTON' ? '' : 'move';
            }
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };

        element.addEventListener('mousedown', function(_e) {
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });

        return {
            wasDragged: function(e) {
                return Math.abs(e.clientX - clickStartX) > 5 || Math.abs(e.clientY - clickStartY) > 5;
            }
        };
    };

    /**
     * Get only point markers from userMarkers array
     * @returns {Array} Array of point markers
     */
    window.getPointMarkersOnly = function() {
        try {
            if (!Array.isArray(window.userMarkers)) return [];
            return window.userMarkers.filter(function(m){
                return m && m.type === 'point' && typeof m.lat === 'number' && typeof m.lon === 'number';
            });
        } catch(_) {
            return [];
        }
    };

    // Create utils object with references to utility functions
    window.utils = {
        showFeedback: window.showFeedback,
        throttle: window.throttle,
        debounce: window.debounce,
        makeDraggable: window.makeDraggable,
        getPointMarkersOnly: window.getPointMarkersOnly
    };

    // Browser global export (export utils object for tests)
    window.Utils = window.utils;

})(window);
