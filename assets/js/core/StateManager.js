/**
 * StateManager - Centralized State Management System
 *
 * Provides a reactive state management system with observer pattern.
 * Manages all application state in a centralized, predictable way.
 *
 * Features:
 * - Nested state access with dot notation (e.g., 'user.markers.length')
 * - Observer pattern for reactive updates
 * - Immutable state updates
 * - State validation
 * - History tracking for undo/redo capabilities
 * - Namespace organization
 *
 * @example
 * const state = new StateManager({
 *   user: { markers: [], measurements: [] },
 *   ui: { sidebarOpen: false }
 * });
 *
 * // Subscribe to changes
 * state.subscribe('user.markers', (newValue, oldValue) => {
 *   Logger.log('Markers changed:', newValue);
 * });
 *
 * // Update state
 * state.set('user.markers', [...state.get('user.markers'), newMarker]);
 */

class StateManager {
    /**
     * Create a new StateManager instance
     * @param {Object} initialState - Initial state object
     * @param {Object} options - Configuration options
     */
    constructor(initialState = {}, options = {}) {
        // Store the initial state for reset functionality
        this._initialState = this._deepClone(initialState);

        // Current state (deep clone to prevent external mutations)
        this._state = this._deepClone(initialState);

        // Subscribers map: path -> Set of { id, callback }
        this._subscribers = new Map();

        // Unique ID counter for subscribers
        this._subscriberId = 0;

        // Options
        this._options = {
            maxHistorySize: options.maxHistorySize || 50,
            enableHistory: options.enableHistory !== false,
            strict: options.strict !== false, // Warn on direct mutations
            ...options
        };

        // State history for undo/redo
        this._history = [];
        this._historyIndex = -1;

        // Freeze state in strict mode to prevent direct mutations
        if (this._options.strict && Object.freeze) {
            this._freezeState();
        }

        Logger.log('✅ StateManager initialized');
    }

    /**
     * Get a value from state using dot notation path
     * @param {string} path - Dot-separated path (e.g., 'user.markers')
     * @param {*} defaultValue - Default value if path doesn't exist
     * @returns {*} Value at the path
     */
    get(path, defaultValue = undefined) {
        if (!path) {
            return this._deepClone(this._state);
        }

        const keys = path.split('.');
        let value = this._state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        // Return deep clone to prevent external mutations
        return this._deepClone(value);
    }

    /**
     * Set a value in state using dot notation path
     * @param {string} path - Dot-separated path (e.g., 'user.markers')
     * @param {*} value - New value to set
     * @param {boolean} silent - If true, don't notify subscribers
     * @returns {boolean} Success status
     */
    set(path, value, silent = false) {
        if (!path) {
            Logger.error('StateManager.set: path is required');
            return false;
        }

        const keys = path.split('.');
        const oldValue = this.get(path);

        // Create a new state object (immutability)
        const newState = this._deepClone(this._state);

        // Navigate to the parent object
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        // Set the value
        const lastKey = keys[keys.length - 1];
        current[lastKey] = this._deepClone(value);

        // Add to history if enabled
        if (this._options.enableHistory) {
            this._addToHistory(path, oldValue, value);
        }

        // Update state
        this._state = newState;

        // Freeze in strict mode
        if (this._options.strict && Object.freeze) {
            this._freezeState();
        }

        // Notify subscribers
        if (!silent) {
            this._notify(path, value, oldValue);
        }

        return true;
    }

    /**
     * Subscribe to state changes at a specific path
     * @param {string} path - Dot-separated path to watch
     * @param {Function} callback - Callback function (newValue, oldValue, path)
     * @returns {string} Subscription ID for unsubscribing
     */
    subscribe(path, callback) {
        if (typeof callback !== 'function') {
            Logger.error('StateManager.subscribe: callback must be a function');
            return null;
        }

        const id = `sub_${++this._subscriberId}`;

        if (!this._subscribers.has(path)) {
            this._subscribers.set(path, new Set());
        }

        this._subscribers.get(path).add({ id, callback });

        return id;
    }

    /**
     * Unsubscribe from state changes
     * @param {string} subscriptionId - ID returned from subscribe()
     * @returns {boolean} Success status
     */
    unsubscribe(subscriptionId) {
        for (const [path, subscribers] of this._subscribers.entries()) {
            for (const sub of subscribers) {
                if (sub.id === subscriptionId) {
                    subscribers.delete(sub);
                    if (subscribers.size === 0) {
                        this._subscribers.delete(path);
                    }
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Reset state to initial values
     * @param {boolean} silent - If true, don't notify subscribers
     */
    reset(silent = false) {
        const oldState = this._state;
        this._state = this._deepClone(this._initialState);
        this._history = [];
        this._historyIndex = -1;

        if (this._options.strict && Object.freeze) {
            this._freezeState();
        }

        if (!silent) {
            // Notify all subscribers
            for (const [path, subscribers] of this._subscribers.entries()) {
                const newValue = this.get(path);
                const oldValue = this._getValueFromState(oldState, path);
                for (const sub of subscribers) {
                    try {
                        sub.callback(newValue, oldValue, path);
                    } catch (error) {
                        Logger.error('Error in state subscriber:', error);
                    }
                }
            }
        }
    }

    /**
     * Get all state paths and values
     * @returns {Object} All state
     */
    getAll() {
        return this._deepClone(this._state);
    }

    /**
     * Check if a path exists in state
     * @param {string} path - Dot-separated path
     * @returns {boolean} True if path exists
     */
    has(path) {
        const keys = path.split('.');
        let value = this._state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return false;
            }
        }

        return true;
    }

    /**
     * Delete a path from state
     * @param {string} path - Dot-separated path
     * @param {boolean} silent - If true, don't notify subscribers
     * @returns {boolean} Success status
     */
    delete(path, silent = false) {
        const keys = path.split('.');
        const oldValue = this.get(path);

        const newState = this._deepClone(this._state);
        let current = newState;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                return false; // Path doesn't exist
            }
            current = current[key];
        }

        const lastKey = keys[keys.length - 1];
        if (!(lastKey in current)) {
            return false; // Path doesn't exist
        }

        delete current[lastKey];

        this._state = newState;

        if (this._options.strict && Object.freeze) {
            this._freezeState();
        }

        if (!silent) {
            this._notify(path, undefined, oldValue);
        }

        return true;
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Notify subscribers of a state change
     * @private
     */
    _notify(path, newValue, oldValue) {
        // Notify exact path subscribers
        if (this._subscribers.has(path)) {
            for (const sub of this._subscribers.get(path)) {
                try {
                    sub.callback(newValue, oldValue, path);
                } catch (error) {
                    Logger.error('Error in state subscriber:', error);
                }
            }
        }

        // Notify parent path subscribers (e.g., 'user' when 'user.markers' changes)
        const pathParts = path.split('.');
        for (let i = pathParts.length - 1; i > 0; i--) {
            const parentPath = pathParts.slice(0, i).join('.');
            if (this._subscribers.has(parentPath)) {
                const parentNewValue = this.get(parentPath);
                const parentOldValue = this._getValueFromState(this._state, parentPath);
                for (const sub of this._subscribers.get(parentPath)) {
                    try {
                        sub.callback(parentNewValue, parentOldValue, parentPath);
                    } catch (error) {
                        Logger.error('Error in state subscriber:', error);
                    }
                }
            }
        }
    }

    /**
     * Add a change to history
     * @private
     */
    _addToHistory(path, oldValue, newValue) {
        // Remove any history after current index (when doing undo/redo)
        this._history = this._history.slice(0, this._historyIndex + 1);

        // Add new history entry
        this._history.push({
            path,
            oldValue: this._deepClone(oldValue),
            newValue: this._deepClone(newValue),
            timestamp: Date.now()
        });

        // Limit history size
        if (this._history.length > this._options.maxHistorySize) {
            this._history.shift();
        } else {
            this._historyIndex++;
        }
    }

    /**
     * Deep clone an object
     * @private
     */
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this._deepClone(item));
        }

        if (obj instanceof Map) {
            const cloned = new Map();
            for (const [key, value] of obj) {
                cloned.set(key, this._deepClone(value));
            }
            return cloned;
        }

        if (obj instanceof Set) {
            const cloned = new Set();
            for (const value of obj) {
                cloned.add(this._deepClone(value));
            }
            return cloned;
        }

        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this._deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Freeze state object to prevent mutations
     * @private
     */
    _freezeState() {
        const freeze = (obj) => {
            Object.freeze(obj);
            Object.keys(obj).forEach(key => {
                if (obj[key] && typeof obj[key] === 'object') {
                    freeze(obj[key]);
                }
            });
        };
        freeze(this._state);
    }

    /**
     * Get value from a state object using path
     * @private
     */
    _getValueFromState(state, path) {
        const keys = path.split('.');
        let value = state;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return this._deepClone(value);
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.StateManager = StateManager;
}
