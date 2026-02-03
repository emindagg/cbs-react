/**
 * DependencyContainer - Dependency Injection Container
 *
 * Provides a centralized container for managing dependencies with
 * constructor injection, lifecycle management, and lazy instantiation.
 *
 * Features:
 * - Service registration and resolution
 * - Lifecycle management (singleton, transient, scoped)
 * - Constructor injection
 * - Lazy instantiation
 * - Circular dependency detection
 * - Named instances
 * - Factory functions
 *
 * Lifecycles:
 * - singleton: One instance shared across entire application
 * - transient: New instance created every time
 * - scoped: One instance per scope (e.g., per request)
 *
 * @example
 * const container = new DependencyContainer();
 *
 * // Register services
 * container.register('map', MapLibre, { lifecycle: 'singleton' });
 * container.register('markerManager', MarkerManager, {
 *   lifecycle: 'singleton',
 *   dependencies: ['map']
 * });
 *
 * // Resolve services
 * const markerManager = container.get('markerManager');
 */

class DependencyContainer {
    /**
     * Safe logging helper - checks if Logger is available
     * @private
     */
    _log(level, ...args) {
        if (typeof window !== 'undefined' && window.Logger && typeof window.Logger[level] === 'function') {
            window.Logger[level](...args);
        } else {
            console[level](...args);
        }
    }

    /**
     * Create a new DependencyContainer instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Registered services map: name -> { factory, lifecycle, dependencies, instance }
        this._services = new Map();

        // Currently resolving services (for circular dependency detection)
        this._resolving = new Set();

        // Scoped instances (for scoped lifecycle)
        this._scopedInstances = new Map();

        // Options
        this._options = {
            autoResolve: options.autoResolve !== false,
            strict: options.strict !== false,
            enableCircularDependencyDetection: options.enableCircularDependencyDetection !== false,
            ...options
        };

        this._log('log', '✅ DependencyContainer initialized');
    }

    /**
     * Register a service with the container
     * @param {string} name - Service name
     * @param {Function|*} factoryOrValue - Factory function, class constructor, or value
     * @param {Object} options - Registration options
     * @returns {DependencyContainer} This container (for chaining)
     */
    register(name, factoryOrValue, options = {}) {
        if (!name) {
            throw new Error('DependencyContainer.register: name is required');
        }

        if (this._services.has(name) && this._options.strict) {
            this._log('warn', `DependencyContainer: Service '${name}' is already registered. Overwriting.`);
        }

        // Normalize options
        const serviceOptions = {
            lifecycle: options.lifecycle || 'singleton', // singleton, transient, scoped
            dependencies: options.dependencies || [],
            tags: options.tags || [],
            metadata: options.metadata || {},
            lazy: options.lazy !== false, // Lazy instantiation by default
            ...options
        };

        // Determine if it's a factory, class, or value
        let factory;
        if (typeof factoryOrValue === 'function') {
            // Check if it's a class or factory function
            const isClass = /^class\s/.test(Function.prototype.toString.call(factoryOrValue));
            if (isClass) {
                // It's a class, wrap in factory
                factory = (container) => {
                    const deps = serviceOptions.dependencies.map(dep => container.get(dep));
                    return new factoryOrValue(...deps);
                };
            } else {
                // It's a factory function
                factory = factoryOrValue;
            }
        } else {
            // It's a value, wrap in factory
            factory = () => factoryOrValue;
        }

        this._services.set(name, {
            factory,
            options: serviceOptions,
            instance: null // Will be set on first get() for singletons
        });

        return this; // For chaining
    }

    /**
     * Register a value directly (bypasses factory)
     * @param {string} name - Service name
     * @param {*} value - Value to register
     * @returns {DependencyContainer} This container (for chaining)
     */
    registerValue(name, value) {
        return this.register(name, () => value, { lifecycle: 'singleton', lazy: false });
    }

    /**
     * Register a singleton service
     * @param {string} name - Service name
     * @param {Function} factoryOrClass - Factory function or class constructor
     * @param {Object} options - Registration options
     * @returns {DependencyContainer} This container (for chaining)
     */
    registerSingleton(name, factoryOrClass, options = {}) {
        return this.register(name, factoryOrClass, { ...options, lifecycle: 'singleton' });
    }

    /**
     * Register a transient service (new instance each time)
     * @param {string} name - Service name
     * @param {Function} factoryOrClass - Factory function or class constructor
     * @param {Object} options - Registration options
     * @returns {DependencyContainer} This container (for chaining)
     */
    registerTransient(name, factoryOrClass, options = {}) {
        return this.register(name, factoryOrClass, { ...options, lifecycle: 'transient' });
    }

    /**
     * Get a service from the container
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        if (!this._services.has(name)) {
            if (this._options.strict) {
                throw new Error(`DependencyContainer.get: Service '${name}' is not registered`);
            }
            return undefined;
        }

        const service = this._services.get(name);

        // Check lifecycle
        if (service.options.lifecycle === 'singleton') {
            // Return cached instance if exists
            if (service.instance) {
                return service.instance;
            }
        } else if (service.options.lifecycle === 'transient') {
            // Always create new instance
            return this._createInstance(name, service);
        } else if (service.options.lifecycle === 'scoped') {
            // Return scoped instance if exists
            if (this._scopedInstances.has(name)) {
                return this._scopedInstances.get(name);
            }
        }

        // Create new instance
        return this._createInstance(name, service);
    }

    /**
     * Check if a service is registered
     * @param {string} name - Service name
     * @returns {boolean} True if registered
     */
    has(name) {
        return this._services.has(name);
    }

    /**
     * Remove a service from the container
     * @param {string} name - Service name
     * @returns {boolean} True if service was removed
     */
    unregister(name) {
        if (this._services.has(name)) {
            this._services.delete(name);
            this._scopedInstances.delete(name);
            return true;
        }
        return false;
    }

    /**
     * Get all registered service names
     * @returns {string[]} Array of service names
     */
    getServices() {
        return Array.from(this._services.keys());
    }

    /**
     * Get services by tag
     * @param {string} tag - Tag name
     * @returns {Object} Map of service name -> instance
     */
    getByTag(tag) {
        const services = {};
        for (const [name, service] of this._services.entries()) {
            if (service.options.tags.includes(tag)) {
                services[name] = this.get(name);
            }
        }
        return services;
    }

    /**
     * Clear all scoped instances (e.g., at end of request)
     */
    clearScoped() {
        this._scopedInstances.clear();
    }

    /**
     * Clear all singleton instances (forces recreation)
     */
    clearSingletons() {
        for (const service of this._services.values()) {
            if (service.options.lifecycle === 'singleton') {
                service.instance = null;
            }
        }
    }

    /**
     * Clear all cached instances
     */
    clear() {
        this.clearSingletons();
        this.clearScoped();
    }

    /**
     * Reset container (clear all services and instances)
     */
    reset() {
        this._services.clear();
        this._scopedInstances.clear();
        this._resolving.clear();
    }

    /**
     * Create a child container with inherited services
     * @returns {DependencyContainer} New child container
     */
    createChild() {
        const child = new DependencyContainer(this._options);

        // Copy service registrations (not instances)
        for (const [name, service] of this._services.entries()) {
            child._services.set(name, {
                factory: service.factory,
                options: service.options,
                instance: null
            });
        }

        return child;
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Create a new service instance
     * @private
     */
    _createInstance(name, service) {
        // Circular dependency detection
        if (this._options.enableCircularDependencyDetection && this._resolving.has(name)) {
            const chain = Array.from(this._resolving).join(' -> ') + ' -> ' + name;
            throw new Error(`Circular dependency detected: ${chain}`);
        }

        // Mark as resolving
        this._resolving.add(name);

        try {
            // Call factory to create instance
            const instance = service.factory(this);

            // Store instance based on lifecycle
            if (service.options.lifecycle === 'singleton') {
                service.instance = instance;
            } else if (service.options.lifecycle === 'scoped') {
                this._scopedInstances.set(name, instance);
            }

            return instance;
        } catch (error) {
            throw new Error(`Error creating service '${name}': ${error.message}`);
        } finally {
            // Remove from resolving set
            this._resolving.delete(name);
        }
    }

    /**
     * Resolve dependencies for a service
     * @private
     */
    _resolveDependencies(dependencies) {
        return dependencies.map(dep => {
            if (typeof dep === 'string') {
                return this.get(dep);
            }
            return dep;
        });
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.DependencyContainer = DependencyContainer;

    // Create a global singleton instance for ServiceLocator pattern
    // This allows tests and legacy code to use: window.ServiceLocator.get('service')
    const globalContainer = new DependencyContainer();
    window.ServiceLocator = globalContainer;

    // Also expose the class for those who want to create their own instances
    window.ServiceLocatorClass = DependencyContainer;
}
