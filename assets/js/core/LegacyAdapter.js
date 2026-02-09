/**
 * LegacyAdapter - Backward Compatibility Layer
 *
 * Provides backward compatibility for existing code that uses global window variables.
 * Maps legacy global variables to the new StateManager system.
 *
 * This allows gradual migration without breaking existing functionality.
 * New code should use the ApplicationCore systems directly.
 *
 * Mapping:
 * - window.userMarkers <-> app.state.get/set('user.markers')
 * - window.measurements <-> app.state.get/set('user.measurements')
 * - window.isDrawing <-> app.state.get/set('drawing.isDrawing')
 * - etc.
 *
 * @example
 * const adapter = new LegacyAdapter(app);
 * adapter.install();
 *
 * // Now old code still works:
 * window.userMarkers.push(marker); // Syncs to state manager
 * const markers = window.userMarkers; // Gets from state manager
 */

class LegacyAdapter {
    /**
     * Create a new LegacyAdapter instance
     * @param {ApplicationCore} app - Application core instance
     */
    constructor(app) {
        if (!app) {
            throw new Error('LegacyAdapter: app is required');
        }

        this.app = app;
        this._installed = false;
        this._proxies = new Map();

        Logger.log('🔗 LegacyAdapter created');
    }

    /**
     * Install the legacy adapter (create global variable proxies)
     */
    install() {
        if (this._installed) {
            Logger.warn('LegacyAdapter: Already installed');
            return;
        }

        Logger.log('🔧 Installing LegacyAdapter...');

        // User data mappings
        this._createArrayProxy('userMarkers', 'user.markers');
        this._createArrayProxy('measurements', 'user.measurements');
        this._createArrayProxy('catalogGeometryLayers', 'user.catalogGeometryLayers');
        this._createArrayProxy('mapMarkers', 'map.markers');
        this._createArrayProxy('bufferLabelMarkers', 'analysis.bufferLabelMarkers');

        // Drawing state mappings
        this._createValueProxy('isDrawing', 'drawing.isDrawing');
        this._createValueProxy('currentTool', 'drawing.currentTool');

        // Analysis state mappings
        this._createValueProxy('bufferActive', 'analysis.bufferActive');
        this._createValueProxy('lastBufferRadius', 'analysis.lastBufferRadius');
        this._createValueProxy('clusteringEnabled', 'map.clusteringEnabled');
        this._createObjectProxy('analysisStates', 'analysis.states');

        // dataSources mapping (special case - not in state, kept as is)
        if (!window.dataSources) {
            window.dataSources = {};
        }

        this._installed = true;
        Logger.log('✅ LegacyAdapter installed successfully');
    }

    /**
     * Uninstall the legacy adapter (restore original globals)
     */
    uninstall() {
        if (!this._installed) {
            return;
        }

        Logger.log('🔧 Uninstalling LegacyAdapter...');

        // Remove all proxies
        for (const [name, descriptor] of this._proxies.entries()) {
            delete window[name];
            if (descriptor.originalValue !== undefined) {
                window[name] = descriptor.originalValue;
            }
        }

        this._proxies.clear();
        this._installed = false;

        Logger.log('✅ LegacyAdapter uninstalled');
    }

    /**
     * Check if adapter is installed
     * @returns {boolean} True if installed
     */
    isInstalled() {
        return this._installed;
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Create a proxy for an array property
     * @private
     */
    _createArrayProxy(windowProperty, statePath) {
        // Store original value if exists
        const originalValue = window[windowProperty];

        // Initialize state if needed
        if (!this.app.state.has(statePath)) {
            this.app.state.set(statePath, originalValue || []);
        }

        // Create a Proxy that intercepts array operations
        const proxyHandler = {
            get: (target, prop) => {
                // Get fresh value from state
                const stateValue = this.app.state.get(statePath) || [];

                // If it's an array method, wrap it to sync back to state
                if (typeof stateValue[prop] === 'function') {
                    return (...args) => {
                        const result = stateValue[prop](...args);

                        // Mutating operations: push, pop, shift, unshift, splice, etc.
                        const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
                        if (mutatingMethods.includes(prop)) {
                            this.app.state.set(statePath, stateValue);
                        }

                        return result;
                    };
                }

                // Return the property value
                return stateValue[prop];
            },

            set: (target, prop, value) => {
                const stateValue = this.app.state.get(statePath) || [];
                stateValue[prop] = value;
                this.app.state.set(statePath, stateValue);
                return true;
            }
        };

        // Create proxy with a dummy array as target
        void new Proxy([], proxyHandler);

        // Define property on window
        Object.defineProperty(window, windowProperty, {
            get: () => this.app.state.get(statePath) || [],
            set: (value) => { this.app.state.set(statePath, value); },
            configurable: true,
            enumerable: true
        });

        // Store proxy info
        this._proxies.set(windowProperty, {
            type: 'array',
            statePath,
            originalValue
        });
    }

    /**
     * Create a proxy for a simple value property
     * @private
     */
    _createValueProxy(windowProperty, statePath) {
        // Store original value if exists
        const originalValue = window[windowProperty];

        // Initialize state if needed
        if (!this.app.state.has(statePath)) {
            this.app.state.set(statePath, originalValue !== undefined ? originalValue : null);
        }

        // Define property on window
        Object.defineProperty(window, windowProperty, {
            get: () => this.app.state.get(statePath),
            set: (value) => { this.app.state.set(statePath, value); },
            configurable: true,
            enumerable: true
        });

        // Store proxy info
        this._proxies.set(windowProperty, {
            type: 'value',
            statePath,
            originalValue
        });
    }

    /**
     * Create a proxy for an object property
     * @private
     */
    _createObjectProxy(windowProperty, statePath) {
        // Store original value if exists
        const originalValue = window[windowProperty];

        // Initialize state if needed
        if (!this.app.state.has(statePath)) {
            this.app.state.set(statePath, originalValue || {});
        }

        // Create a Proxy that intercepts object operations
        const proxyHandler = {
            get: (target, prop) => {
                const stateValue = this.app.state.get(statePath) || {};
                return stateValue[prop];
            },

            set: (target, prop, value) => {
                const stateValue = this.app.state.get(statePath) || {};
                stateValue[prop] = value;
                this.app.state.set(statePath, stateValue);
                return true;
            },

            has: (target, prop) => {
                const stateValue = this.app.state.get(statePath) || {};
                return prop in stateValue;
            },

            deleteProperty: (target, prop) => {
                const stateValue = this.app.state.get(statePath) || {};
                delete stateValue[prop];
                this.app.state.set(statePath, stateValue);
                return true;
            }
        };

        // Create proxy with a dummy object as target
        void new Proxy({}, proxyHandler);

        // Define property on window
        Object.defineProperty(window, windowProperty, {
            get: () => {
                const stateValue = this.app.state.get(statePath) || {};
                return new Proxy(stateValue, {
                    get: (target, prop) => target[prop],
                    set: (target, prop, value) => {
                        target[prop] = value;
                        this.app.state.set(statePath, target);
                        return true;
                    }
                });
            },
            set: (value) => { this.app.state.set(statePath, value); },
            configurable: true,
            enumerable: true
        });

        // Store proxy info
        this._proxies.set(windowProperty, {
            type: 'object',
            statePath,
            originalValue
        });
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.LegacyAdapter = LegacyAdapter;
}
