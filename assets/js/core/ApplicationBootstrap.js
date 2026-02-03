/**
 * ApplicationBootstrap - New Application Bootstrap System
 *
 * Replaces the old app-init.js and app-bootstrap.js with a modern
 * architecture that uses ApplicationCore, DependencyContainer, and ModuleRegistry.
 *
 * This provides:
 * - Centralized initialization
 * - Dependency injection
 * - Module lifecycle management
 * - Backward compatibility via LegacyAdapter
 *
 * Initialization sequence:
 * 1. Initialize ApplicationCore (state, events, config, DI, modules)
 * 2. Install LegacyAdapter (for backward compatibility)
 * 3. Call existing initialization functions (map, panels, etc.)
 * 4. Register all modules in ModuleRegistry
 * 5. Initialize and start all modules
 *
 * @example
 * // In index.html, after all scripts are loaded:
 * const bootstrap = new ApplicationBootstrap();
 * await bootstrap.start();
 */
 
// Safe Logger fallback (avoid runtime errors if Logger is not ready)
const __BOOTSTRAP_LOGGER = (typeof window !== 'undefined' && window.Logger && typeof window.Logger.log === 'function' && typeof window.Logger.warn === 'function' && typeof window.Logger.error === 'function')
    ? window.Logger
    : {
        log: (...args) => console.log(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    };

class ApplicationBootstrap {
    /**
     * Create a new ApplicationBootstrap instance
     * @param {Object} options - Bootstrap options
     */
    constructor(options = {}) {
        this._options = {
            environment: options.environment || this._detectEnvironment(),
            enableLegacyAdapter: options.enableLegacyAdapter !== false,
            logProgress: options.logProgress !== false,
            ...options
        };

        this._app = null;
        this._adapter = null;
        this._started = false;

__BOOTSTRAP_LOGGER.log('🚀 ApplicationBootstrap created');
    }

    /**
     * Start the application
     * @returns {Promise<ApplicationBootstrap>} This instance
     */
    async start() {
        if (this._started) {
__BOOTSTRAP_LOGGER.warn('ApplicationBootstrap: Already started');
            return this;
        }

        try {
__BOOTSTRAP_LOGGER.log('🌟 Starting application...');
__BOOTSTRAP_LOGGER.log('');

            // 1. Initialize ApplicationCore
            await this._initializeCore();

            // 2. Install LegacyAdapter
            if (this._options.enableLegacyAdapter) {
                await this._installLegacyAdapter();
            }

            // 3. Wait for map to be ready (if using existing initialization)
            await this._waitForMap();

            // 4. Run existing initialization functions
            await this._runExistingInitialization();

            // 6. Register modules
            await this._registerModules();

            // 7. Initialize map and basic systems (already done by existing init)
            // This is handled by the existing initialization functions

            // 8. Initialize and start modules
            await this._app.start();

            this._started = true;

__BOOTSTRAP_LOGGER.log('');
__BOOTSTRAP_LOGGER.log('✅ Application started successfully!');
__BOOTSTRAP_LOGGER.log('📊 Stats:');
__BOOTSTRAP_LOGGER.log(`   - Modules: ${this._app.modules.getModules().length}`);
__BOOTSTRAP_LOGGER.log(`   - Services: ${this._app.container.getServices().length}`);
__BOOTSTRAP_LOGGER.log(`   - Environment: ${this._app.config.getEnvironment()}`);
            __BOOTSTRAP_LOGGER.log('');

            // Make app globally available
            window.app = this._app;

            return this;
        } catch (error) {
__BOOTSTRAP_LOGGER.error('❌ Failed to start application:', error);
            throw error;
        }
    }

    /**
     * Stop the application
     * @returns {Promise<ApplicationBootstrap>} This instance
     */
    async stop() {
        if (!this._started) {
            return this;
        }

__BOOTSTRAP_LOGGER.log('⏸️ Stopping application...');

        try {
            await this._app.stop();
            this._started = false;
__BOOTSTRAP_LOGGER.log('✅ Application stopped');

            return this;
        } catch (error) {
__BOOTSTRAP_LOGGER.error('❌ Failed to stop application:', error);
            throw error;
        }
    }

    /**
     * Get the application core instance
     * @returns {ApplicationCore} Application core
     */
    getApp() {
        return this._app;
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Initialize ApplicationCore
     * @private
     */
    async _initializeCore() {
        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('1️⃣ Initializing ApplicationCore...');
        }

        this._app = new ApplicationCore({
            environment: this._options.environment,
            config: {
                map: {
                    center: [39.9334, 32.8597],
                    zoom: 6,
                    minZoom: 4,
                    maxZoom: 18
                }
            }
        });

        await this._app.initialize();

        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('   ✓ ApplicationCore initialized\n');
        }
    }

    /**
     * Install LegacyAdapter for backward compatibility
     * @private
     */
    async _installLegacyAdapter() {
        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('2️⃣ Installing LegacyAdapter...');
        }

        this._adapter = new LegacyAdapter(this._app);
        this._adapter.install();

        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('   ✓ LegacyAdapter installed\n');
        }
    }

    /**
     * Wait for map to be ready
     * @private
     */
    async _waitForMap() {
        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('3️⃣ Waiting for map...');
        }

        // Wait for map to be available
        let attempts = 0;
        const maxAttempts = 50;

        while (!window.map && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.map) {
            throw new Error('Map not initialized after 5 seconds');
        }

        // Wait for map to load
        if (!window.map.loaded()) {
            await new Promise(resolve => {
                window.map.once('load', resolve);
            });
        }

        // Register map in DI container
        this._app.container.registerValue('map', window.map);

        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('   ✓ Map ready and registered in DI\n');
        }
    }

    /**
     * Run existing initialization functions
     * @private
     */
    async _runExistingInitialization() {
        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('3️⃣ Running existing initialization...');
        }

        // These functions are from the existing initialization modules
        // They're already called by app-init.js, but we need to ensure they're executed

        // State initialization (already done by LegacyAdapter, but ensure it's set)
        if (typeof initializeGlobalState === 'function') {
            // Don't call this - LegacyAdapter handles it
__BOOTSTRAP_LOGGER.log('   ⊙ Global state (handled by LegacyAdapter)');
        }

        // UI Panels (IIFE - already executed)
__BOOTSTRAP_LOGGER.log('   ⊙ UI panels (auto-initialized)');

        // Map core
        if (typeof initializeMapCore === 'function') {
__BOOTSTRAP_LOGGER.log('   ⊙ Map core (will be initialized)');
            // Don't call yet - let the existing app-init handle it
        }

        // Map sources
        if (typeof initializeMapSources === 'function') {
__BOOTSTRAP_LOGGER.log('   ⊙ Map sources (will be initialized)');
            // Don't call yet - let the existing app-init handle it
        }

        // Map layers
        if (typeof initializeMapLayers === 'function') {
__BOOTSTRAP_LOGGER.log('   ⊙ Map layers (will be initialized)');
            // Don't call yet - let the existing app-init handle it
        }

        // Orchestrators
        if (typeof initializeOrchestrators === 'function') {
__BOOTSTRAP_LOGGER.log('   ⊙ Orchestrators (will be initialized)');
            // Don't call yet - let the existing app-init handle it
        }

        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('   ✓ Existing initialization prepared\n');
        }
    }

    /**
     * Register modules in ModuleRegistry
     * @private
     */
    async _registerModules() {
        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log('4️⃣ Registering modules...');
        }

        // Register map as a module (get from container)
        this._app.modules.register({
            name: 'map',
            dependencies: [],
            initialize: (container) => {
                return container.get('map');
            }
        });

        // Register modules from DI Container
        const serviceModules = [
            'dataManager',
            'markerManager',
            'drawingManager',
            'uiComponents',
            'labelManager',
            'timelineManager',
            'visualizationManager',
            'importExport',
            'eventHandlers'
        ];

        for (const serviceName of serviceModules) {
            if (this._app.container.has(serviceName)) {
                this._app.modules.register({
                    name: serviceName,
                    dependencies: ['map'],
                    initialize: (container) => {
                        const service = container.get(serviceName);
__BOOTSTRAP_LOGGER.log(`   ✓ ${serviceName} registered from DI Container`);
                        return service;
                    }
                });
            } else {
__BOOTSTRAP_LOGGER.warn(`   ⚠️ ${serviceName} not found in DI Container, skipping`);
            }
        }

        if (this._options.logProgress) {
__BOOTSTRAP_LOGGER.log(`   ✓ Registered ${this._app.modules.getModules().length} modules\n`);
        }
    }

    /**
     * Detect environment
     * @private
     */
    _detectEnvironment() {
        if (typeof window === 'undefined') {
            return 'development';
        }

        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return 'development';
        }

        return 'production';
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.ApplicationBootstrap = ApplicationBootstrap;
}

// Auto-start on DOMContentLoaded (optional, can be disabled)
if (typeof window !== 'undefined' && window.location) {
    // Check if auto-start is enabled (default: true for now, but will be false later)
    const autoStart = false; // Set to false to allow manual start

    if (autoStart) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                const bootstrap = new ApplicationBootstrap();
                await bootstrap.start();
            });
        } else {
            // DOM already loaded
            (async () => {
                const bootstrap = new ApplicationBootstrap();
                await bootstrap.start();
            })();
        }
    }
}
