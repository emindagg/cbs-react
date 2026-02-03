/**
 * ModuleRegistry - Module Registration and Lifecycle Management
 *
 * Provides a centralized registry for application modules with
 * lifecycle management, dependency resolution, and initialization ordering.
 *
 * Features:
 * - Module registration and retrieval
 * - Lifecycle management (register -> initialize -> start -> stop -> destroy)
 * - Dependency-based initialization ordering
 * - Module status tracking
 * - Hot module replacement support
 * - Module metadata and versioning
 *
 * Module Lifecycle:
 * 1. registered - Module is registered but not initialized
 * 2. initialized - Module's initialize() method has been called
 * 3. started - Module's start() method has been called (if exists)
 * 4. stopped - Module's stop() method has been called
 * 5. destroyed - Module is destroyed and can be garbage collected
 *
 * @example
 * const registry = new ModuleRegistry();
 *
 * // Register a module
 * registry.register({
 *   name: 'markerManager',
 *   dependencies: ['map', 'stateManager'],
 *   initialize: (container) => {
 *     const map = container.get('map');
 *     return new MarkerManager(map);
 *   }
 * });
 *
 * // Initialize all modules
 * await registry.initializeAll(container);
 */

class ModuleRegistry {
    /**
     * Create a new ModuleRegistry instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Registered modules map: name -> { module, status, instance, metadata }
        this._modules = new Map();

        // Module initialization order (resolved from dependencies)
        this._initOrder = [];

        // Options
        this._options = {
            strict: options.strict !== false,
            autoInitialize: options.autoInitialize !== false,
            logLifecycle: options.logLifecycle !== false,
            ...options
        };

        Logger.log('✅ ModuleRegistry initialized');
    }

    /**
     * Register a module
     * @param {Object} module - Module definition
     * @param {string} module.name - Module name
     * @param {Function} module.initialize - Initialization function
     * @param {Array} module.dependencies - Module dependencies
     * @param {Function} module.start - Start function (optional)
     * @param {Function} module.stop - Stop function (optional)
     * @param {Function} module.destroy - Destroy function (optional)
     * @param {Object} module.metadata - Module metadata (optional)
     * @returns {ModuleRegistry} This registry (for chaining)
     */
    register(module) {
        if (!module.name) {
            throw new Error('ModuleRegistry.register: module.name is required');
        }

        if (!module.initialize || typeof module.initialize !== 'function') {
            throw new Error(`ModuleRegistry.register: module '${module.name}' must have an initialize function`);
        }

        if (this._modules.has(module.name) && this._options.strict) {
            Logger.warn(`ModuleRegistry: Module '${module.name}' is already registered. Overwriting.`);
        }

        // Normalize module definition
        const normalizedModule = {
            name: module.name,
            dependencies: module.dependencies || [],
            initialize: module.initialize,
            start: module.start || null,
            stop: module.stop || null,
            destroy: module.destroy || null,
            metadata: {
                version: module.version || '1.0.0',
                description: module.description || '',
                author: module.author || '',
                ...module.metadata
            }
        };

        this._modules.set(module.name, {
            module: normalizedModule,
            status: 'registered',
            instance: null,
            error: null,
            registeredAt: Date.now(),
            initializedAt: null,
            startedAt: null
        });

        // Invalidate init order (will be recalculated)
        this._initOrder = [];

        if (this._options.logLifecycle) {
            Logger.log(`📦 Module '${module.name}' registered`);
        }

        return this;
    }

    /**
     * Get a module's instance
     * @param {string} name - Module name
     * @returns {*} Module instance or undefined
     */
    get(name) {
        const entry = this._modules.get(name);
        return entry ? entry.instance : undefined;
    }

    /**
     * Check if a module is registered
     * @param {string} name - Module name
     * @returns {boolean} True if registered
     */
    has(name) {
        return this._modules.has(name);
    }

    /**
     * Get module status
     * @param {string} name - Module name
     * @returns {string} Status or undefined
     */
    getStatus(name) {
        const entry = this._modules.get(name);
        return entry ? entry.status : undefined;
    }

    /**
     * Get all registered module names
     * @returns {string[]} Array of module names
     */
    getModules() {
        return Array.from(this._modules.keys());
    }

    /**
     * Get module metadata
     * @param {string} name - Module name
     * @returns {Object} Module metadata or undefined
     */
    getMetadata(name) {
        const entry = this._modules.get(name);
        return entry ? entry.module.metadata : undefined;
    }

    /**
     * Initialize a specific module
     * @param {string} name - Module name
     * @param {DependencyContainer} container - Dependency container
     * @returns {Promise<*>} Module instance
     */
    async initialize(name, container) {
        const entry = this._modules.get(name);

        if (!entry) {
            throw new Error(`ModuleRegistry.initialize: Module '${name}' is not registered`);
        }

        // Already initialized?
        if (entry.status === 'initialized' || entry.status === 'started') {
            return entry.instance;
        }

        // Check dependencies
        for (const dep of entry.module.dependencies) {
            const depEntry = this._modules.get(dep);
            if (!depEntry) {
                throw new Error(`ModuleRegistry.initialize: Module '${name}' depends on '${dep}' which is not registered`);
            }
            if (depEntry.status === 'registered') {
                // Initialize dependency first
                await this.initialize(dep, container);
            }
        }

        try {
            // Call initialize function
            entry.instance = await Promise.resolve(entry.module.initialize(container));
            entry.status = 'initialized';
            entry.initializedAt = Date.now();

            if (this._options.logLifecycle) {
                Logger.log(`✅ Module '${name}' initialized`);
            }

            return entry.instance;
        } catch (error) {
            entry.error = error;
            entry.status = 'error';
            Logger.error(`❌ Error initializing module '${name}':`, error);
            throw error;
        }
    }

    /**
     * Initialize all registered modules in dependency order
     * @param {DependencyContainer} container - Dependency container
     * @returns {Promise<Object>} Map of module name -> instance
     */
    async initializeAll(container) {
        // Calculate initialization order
        const order = this._calculateInitOrder();

        const instances = {};

        for (const name of order) {
            try {
                instances[name] = await this.initialize(name, container);
            } catch (error) {
                Logger.error(`Failed to initialize module '${name}':`, error);
                if (this._options.strict) {
                    throw error;
                }
            }
        }

        return instances;
    }

    /**
     * Start a specific module (calls optional start() method)
     * @param {string} name - Module name
     * @returns {Promise<boolean>} Success status
     */
    async start(name) {
        const entry = this._modules.get(name);

        if (!entry) {
            throw new Error(`ModuleRegistry.start: Module '${name}' is not registered`);
        }

        if (entry.status !== 'initialized') {
            throw new Error(`ModuleRegistry.start: Module '${name}' must be initialized before starting`);
        }

        if (!entry.module.start) {
            // No start method, consider it started
            entry.status = 'started';
            entry.startedAt = Date.now();
            return true;
        }

        try {
            await Promise.resolve(entry.module.start(entry.instance));
            entry.status = 'started';
            entry.startedAt = Date.now();

            if (this._options.logLifecycle) {
                Logger.log(`▶️ Module '${name}' started`);
            }

            return true;
        } catch (error) {
            entry.error = error;
            Logger.error(`❌ Error starting module '${name}':`, error);
            throw error;
        }
    }

    /**
     * Start all initialized modules
     * @returns {Promise<boolean>} Success status
     */
    async startAll() {
        for (const name of this._modules.keys()) {
            const entry = this._modules.get(name);
            if (entry.status === 'initialized') {
                try {
                    await this.start(name);
                } catch (error) {
                    Logger.error(`Failed to start module '${name}':`, error);
                    if (this._options.strict) {
                        throw error;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Stop a specific module
     * @param {string} name - Module name
     * @returns {Promise<boolean>} Success status
     */
    async stop(name) {
        const entry = this._modules.get(name);

        if (!entry) {
            throw new Error(`ModuleRegistry.stop: Module '${name}' is not registered`);
        }

        if (entry.status !== 'started' && entry.status !== 'initialized') {
            return true; // Already stopped or not started
        }

        if (!entry.module.stop) {
            entry.status = 'stopped';
            return true;
        }

        try {
            await Promise.resolve(entry.module.stop(entry.instance));
            entry.status = 'stopped';

            if (this._options.logLifecycle) {
                Logger.log(`⏸️ Module '${name}' stopped`);
            }

            return true;
        } catch (error) {
            entry.error = error;
            Logger.error(`❌ Error stopping module '${name}':`, error);
            throw error;
        }
    }

    /**
     * Stop all started modules
     * @returns {Promise<boolean>} Success status
     */
    async stopAll() {
        // Stop in reverse init order
        const order = this._calculateInitOrder().reverse();

        for (const name of order) {
            const entry = this._modules.get(name);
            if (entry.status === 'started' || entry.status === 'initialized') {
                try {
                    await this.stop(name);
                } catch (error) {
                    Logger.error(`Failed to stop module '${name}':`, error);
                }
            }
        }

        return true;
    }

    /**
     * Unregister a module
     * @param {string} name - Module name
     * @returns {boolean} Success status
     */
    unregister(name) {
        if (this._modules.has(name)) {
            this._modules.delete(name);
            this._initOrder = [];
            return true;
        }
        return false;
    }

    /**
     * Reset registry (unregister all modules)
     */
    reset() {
        this._modules.clear();
        this._initOrder = [];
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Calculate initialization order based on dependencies
     * @private
     */
    _calculateInitOrder() {
        if (this._initOrder.length > 0) {
            return this._initOrder;
        }

        const order = [];
        const visited = new Set();
        const visiting = new Set();

        const visit = (name) => {
            if (visited.has(name)) {
                return;
            }

            if (visiting.has(name)) {
                const chain = Array.from(visiting).join(' -> ') + ' -> ' + name;
                throw new Error(`Circular module dependency detected: ${chain}`);
            }

            const entry = this._modules.get(name);
            if (!entry) {
                throw new Error(`Module '${name}' is not registered`);
            }

            visiting.add(name);

            for (const dep of entry.module.dependencies) {
                visit(dep);
            }

            visiting.delete(name);
            visited.add(name);
            order.push(name);
        };

        for (const name of this._modules.keys()) {
            visit(name);
        }

        this._initOrder = order;
        return order;
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.ModuleRegistry = ModuleRegistry;
}
