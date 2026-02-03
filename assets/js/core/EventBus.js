/**
 * EventBus - Centralized Event System
 *
 * Provides a pub/sub (publish-subscribe) pattern for decoupled communication
 * between modules. Modules can emit and listen to events without knowing
 * about each other's existence.
 *
 * Features:
 * - Event subscription and emission
 * - One-time event listeners
 * - Wildcard event patterns
 * - Priority-based listeners
 * - Event history for debugging
 * - Async event handling support
 *
 * @example
 * const bus = new EventBus();
 *
 * // Subscribe to an event
 * bus.on('data:added', (data) => {
 *   Logger.log('Data added:', data);
 * });
 *
 * // Emit an event
 * bus.emit('data:added', { id: 1, name: 'Test' });
 *
 * // One-time subscription
 * bus.once('map:loaded', () => {
 *   Logger.log('Map loaded once');
 * });
 *
 * // Wildcard subscription
 * bus.on('data:*', (data, event) => {
 *   Logger.log('Any data event:', event, data);
 * });
 */

class EventBus {
    /**
     * Create a new EventBus instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Event listeners map: eventName -> Array of { handler, priority, once }
        this._listeners = new Map();

        // Event history for debugging
        this._history = [];

        // Options
        this._options = {
            maxHistorySize: options.maxHistorySize || 100,
            enableHistory: options.enableHistory !== false,
            enableWildcards: options.enableWildcards !== false,
            async: options.async !== false, // Allow async handlers
            ...options
        };

        Logger.log('✅ EventBus initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Event name (supports wildcards like 'data:*')
     * @param {Function} handler - Event handler function
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    on(eventName, handler, options = {}) {
        if (typeof handler !== 'function') {
            Logger.error('EventBus.on: handler must be a function');
            return () => {};
        }

        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
        }

        const listener = {
            handler,
            priority: options.priority || 0,
            once: false,
            context: options.context || null
        };

        // Add listener in priority order (higher priority first)
        const listeners = this._listeners.get(eventName);
        let inserted = false;
        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i].priority < listener.priority) {
                listeners.splice(i, 0, listener);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            listeners.push(listener);
        }

        // Return unsubscribe function
        return () => this.off(eventName, handler);
    }

    /**
     * Subscribe to an event once (auto-unsubscribes after first call)
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function
     * @param {Object} options - Subscription options
     * @returns {Function} Unsubscribe function
     */
    once(eventName, handler, options = {}) {
        const wrappedHandler = (...args) => {
            this.off(eventName, wrappedHandler);
            handler(...args);
        };

        return this.on(eventName, wrappedHandler, { ...options, once: true });
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function to remove (optional, removes all if not specified)
     * @returns {boolean} Success status
     */
    off(eventName, handler = null) {
        if (!this._listeners.has(eventName)) {
            return false;
        }

        if (handler === null) {
            // Remove all listeners for this event
            this._listeners.delete(eventName);
            return true;
        }

        // Remove specific handler
        const listeners = this._listeners.get(eventName);
        const index = listeners.findIndex(l => l.handler === handler);

        if (index !== -1) {
            listeners.splice(index, 1);
            if (listeners.length === 0) {
                this._listeners.delete(eventName);
            }
            return true;
        }

        return false;
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @returns {Promise<number>} Number of handlers that were called
     */
    async emit(eventName, data) {
        let handlerCount = 0;

        // Add to history
        if (this._options.enableHistory) {
            this._addToHistory(eventName, data);
        }

        // Get exact match listeners
        const exactListeners = this._listeners.get(eventName) || [];

        // Get wildcard listeners if enabled
        let wildcardListeners = [];
        if (this._options.enableWildcards) {
            wildcardListeners = this._getWildcardListeners(eventName);
        }

        // Combine and sort by priority
        const allListeners = [...exactListeners, ...wildcardListeners]
            .sort((a, b) => b.priority - a.priority);

        // Call handlers
        for (const listener of allListeners) {
            try {
                handlerCount++;
                if (this._options.async) {
                    await Promise.resolve(listener.handler.call(listener.context, data, eventName));
                } else {
                    listener.handler.call(listener.context, data, eventName);
                }
            } catch (error) {
                Logger.error(`Error in event handler for '${eventName}':`, error);
            }
        }

        return handlerCount;
    }

    /**
     * Emit an event synchronously (without async/await)
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     * @returns {number} Number of handlers that were called
     */
    emitSync(eventName, data) {
        let handlerCount = 0;

        // Add to history
        if (this._options.enableHistory) {
            this._addToHistory(eventName, data);
        }

        // Get exact match listeners
        const exactListeners = this._listeners.get(eventName) || [];

        // Get wildcard listeners if enabled
        let wildcardListeners = [];
        if (this._options.enableWildcards) {
            wildcardListeners = this._getWildcardListeners(eventName);
        }

        // Combine and sort by priority
        const allListeners = [...exactListeners, ...wildcardListeners]
            .sort((a, b) => b.priority - a.priority);

        // Call handlers
        for (const listener of allListeners) {
            try {
                handlerCount++;
                listener.handler.call(listener.context, data, eventName);
            } catch (error) {
                Logger.error(`Error in event handler for '${eventName}':`, error);
            }
        }

        return handlerCount;
    }

    /**
     * Check if an event has any listeners
     * @param {string} eventName - Event name
     * @returns {boolean} True if event has listeners
     */
    hasListeners(eventName) {
        if (this._listeners.has(eventName) && this._listeners.get(eventName).length > 0) {
            return true;
        }

        if (this._options.enableWildcards) {
            return this._getWildcardListeners(eventName).length > 0;
        }

        return false;
    }

    /**
     * Get all registered event names
     * @returns {string[]} Array of event names
     */
    getEvents() {
        return Array.from(this._listeners.keys());
    }

    /**
     * Clear all listeners for an event or all events
     * @param {string} eventName - Event name (optional, clears all if not specified)
     */
    clear(eventName = null) {
        if (eventName) {
            this._listeners.delete(eventName);
        } else {
            this._listeners.clear();
        }
    }

    /**
     * Get event history (for debugging)
     * @param {number} limit - Maximum number of events to return
     * @returns {Array} Array of historical events
     */
    getHistory(limit = 50) {
        return this._history.slice(-limit);
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this._history = [];
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Get listeners that match wildcard patterns
     * @private
     */
    _getWildcardListeners(eventName) {
        const listeners = [];

        for (const [pattern, patternListeners] of this._listeners.entries()) {
            if (pattern.includes('*')) {
                if (this._matchWildcard(pattern, eventName)) {
                    listeners.push(...patternListeners);
                }
            }
        }

        return listeners;
    }

    /**
     * Check if event name matches wildcard pattern
     * @private
     */
    _matchWildcard(pattern, eventName) {
        // Convert wildcard pattern to regex
        // Example: 'data:*' -> /^data:[^:]+$/
        // Example: 'user:*:updated' -> /^user:[^:]+:updated$/
        const regexPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
            .replace(/\*/g, '[^:]+'); // Replace * with regex

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(eventName);
    }

    /**
     * Add event to history
     * @private
     */
    _addToHistory(eventName, data) {
        this._history.push({
            event: eventName,
            data,
            timestamp: Date.now()
        });

        // Limit history size
        if (this._history.length > this._options.maxHistorySize) {
            this._history.shift();
        }
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
}
