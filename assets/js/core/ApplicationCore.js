/**
 * ApplicationCore - Central Application Orchestrator
 *
 * Bootstraps and coordinates all core systems:
 * - StateManager: Centralized state management
 * - EventBus: Event-driven communication
 * - AppConfig: Configuration management
 * - DependencyContainer: Dependency injection
 * - ModuleRegistry: Module lifecycle management
 *
 * This is the single entry point for initializing the entire application.
 *
 * @example
 * // Initialize application
 * const app = new ApplicationCore({
 *   environment: 'production',
 *   config: { map: { center: [39.9334, 32.8597] } }
 * });
 *
 * await app.initialize();
 *
 * // Access core systems
 * app.state.set('user.markers', markers);
 * app.events.emit('data:loaded', data);
 * const markerManager = app.container.get('markerManager');
 */

// Safe Logger wrapper - ensures Logger is available before using it
const _Logger = {
    log: (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args),
    info: (...args) => window.Logger?.info ? window.Logger.info(...args) : console.info(...args),
    warn: (...args) => window.Logger?.warn ? window.Logger.warn(...args) : console.warn(...args),
    error: (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args)
};

class ApplicationCore {
    /**
     * Create a new ApplicationCore instance
     * @param {Object} options - Initialization options
     */
    constructor(options = {}) {
        this._options = options;
        this._initialized = false;
        this._started = false;

        // Core systems (will be initialized in initialize())
        this.state = null;
        this.events = null;
        this.config = null;
        this.container = null;
        this.modules = null;

        _Logger.log('🚀 ApplicationCore created');
    }

    /**
     * Initialize all core systems
     * @returns {Promise<ApplicationCore>} This instance
     */
    async initialize() {
        if (this._initialized) {
            _Logger.warn('ApplicationCore: Already initialized');
            return this;
        }

        _Logger.log('⚙️ Initializing ApplicationCore...');

        try {
            // 1. Initialize Configuration System
            await this._initializeConfig();

            // 2. Initialize State Management
            await this._initializeStateManager();

            // 3. Initialize Event Bus
            await this._initializeEventBus();

            // 4. Initialize Dependency Container
            await this._initializeDependencyContainer();

            // 5. Initialize Module Registry
            await this._initializeModuleRegistry();

            // 6. Register core services
            await this._registerCoreServices();

            // 7. Register application services
            await this._registerApplicationServices();

            // 8. Wire up integrations between systems
            await this._wireIntegrations();

            this._initialized = true;
            _Logger.log('✅ ApplicationCore initialized successfully');

            // Emit initialization event
            this.events.emit('core:initialized', { app: this });

            return this;
        } catch (error) {
            _Logger.error('❌ Failed to initialize ApplicationCore:', error);
            throw error;
        }
    }

    /**
     * Start the application (initialize and start all modules)
     * @returns {Promise<ApplicationCore>} This instance
     */
    async start() {
        if (!this._initialized) {
            await this.initialize();
        }

        if (this._started) {
            _Logger.warn('ApplicationCore: Already started');
            return this;
        }

        _Logger.log('▶️ Starting application...');

        try {
            // Initialize all registered modules
            await this.modules.initializeAll(this.container);

            // Start all modules
            await this.modules.startAll();

            this._started = true;
            _Logger.log('✅ Application started successfully');

            // Emit start event
            this.events.emit('app:started', { app: this });

            return this;
        } catch (error) {
            _Logger.error('❌ Failed to start application:', error);
            throw error;
        }
    }

    /**
     * Stop the application
     * @returns {Promise<ApplicationCore>} This instance
     */
    async stop() {
        if (!this._started) {
            return this;
        }

        _Logger.log('⏸️ Stopping application...');

        try {
            // Stop all modules
            await this.modules.stopAll();

            this._started = false;
            _Logger.log('✅ Application stopped');

            // Emit stop event
            this.events.emit('app:stopped', { app: this });

            return this;
        } catch (error) {
            _Logger.error('❌ Failed to stop application:', error);
            throw error;
        }
    }

    /**
     * Get a service from the container
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        return this.container.get(name);
    }

    /**
     * Check if application is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Check if application is started
     * @returns {boolean} True if started
     */
    isStarted() {
        return this._started;
    }

    // ==========================================
    // PRIVATE INITIALIZATION METHODS
    // ==========================================

    /**
     * Initialize AppConfig
     * @private
     */
    async _initializeConfig() {
        const environment = this._options.environment || 'development';
        const configData = this._options.config || {};

        this.config = new AppConfig(configData, {
            environment,
            strict: this._options.strict !== false,
            frozen: environment === 'production'
        });

        _Logger.log('  ✓ AppConfig initialized');
    }

    /**
     * Initialize StateManager
     * @private
     */
    async _initializeStateManager() {
        const initialState = this._options.initialState || {
            // User data
            user: {
                markers: [],
                measurements: [],
                catalogGeometryLayers: []
            },

            // Drawing state
            drawing: {
                isDrawing: false,
                currentTool: null
            },

            // Analysis state
            analysis: {
                bufferActive: false,
                lastBufferRadius: null,
                bufferLabelMarkers: [],
                states: {
                    convex: false,
                    voronoi: false,
                    nearest: false
                }
            },

            // Map state
            map: {
                markers: [],
                clusteringEnabled: false
            },

            // UI state
            ui: {
                sidebarOpen: false,
                toolsPanelOpen: false
            }
        };

        this.state = new StateManager(initialState, {
            maxHistorySize: this._options.maxHistorySize || 50,
            enableHistory: this._options.enableHistory !== false,
            strict: this._options.strict !== false
        });

        _Logger.log('  ✓ StateManager initialized');
    }

    /**
     * Initialize EventBus
     * @private
     */
    async _initializeEventBus() {
        this.events = new EventBus({
            maxHistorySize: this._options.maxEventHistory || 100,
            enableHistory: this._options.enableEventHistory !== false,
            enableWildcards: true,
            async: true
        });

        _Logger.log('  ✓ EventBus initialized');
    }

    /**
     * Initialize DependencyContainer
     * @private
     */
    async _initializeDependencyContainer() {
        this.container = new DependencyContainer({
            autoResolve: true,
            strict: this._options.strict !== false,
            enableCircularDependencyDetection: true
        });

        _Logger.log('  ✓ DependencyContainer initialized');
    }

    /**
     * Initialize ModuleRegistry
     * @private
     */
    async _initializeModuleRegistry() {
        this.modules = new ModuleRegistry({
            strict: this._options.strict !== false,
            autoInitialize: true,
            logLifecycle: this._options.logModuleLifecycle !== false
        });

        _Logger.log('  ✓ ModuleRegistry initialized');
    }

    /**
     * Register core services in dependency container
     * @private
     */
    async _registerCoreServices() {
        // Register core systems as services
        this.container.registerValue('stateManager', this.state);
        this.container.registerValue('eventBus', this.events);
        this.container.registerValue('config', this.config);
        this.container.registerValue('container', this.container);
        this.container.registerValue('moduleRegistry', this.modules);
        this.container.registerValue('app', this);

        _Logger.log('  ✓ Core services registered');
    }

    /**
     * Register application services in dependency container
     * @private
     */
    async _registerApplicationServices() {
        // Register map instance (if available)
        if (typeof window !== 'undefined' && window.map) {
            this.container.registerValue('map', window.map);
        }

        // Register Data Services
        this.container.registerSingleton('dataManager', () => {
            if (typeof DataManager !== 'undefined') {
                return new DataManager();
            }
            throw new Error('DataManager class not available');
        });

        this.container.registerSingleton('markerManager', (container) => {
            if (typeof MarkerManager !== 'undefined') {
                const map = container.get('map');
                const stateManager = container.get('stateManager');
                const eventBus = container.get('eventBus');

                // Support both old and new constructor signatures
                return new MarkerManager({ map, stateManager, eventBus });
            }
            throw new Error('MarkerManager class not available');
        });

        this.container.registerSingleton('drawingManager', (container) => {
            if (typeof DataDrawing !== 'undefined') {
                const map = container.get('map');
                const stateManager = container.get('stateManager');
                const eventBus = container.get('eventBus');

                return new DataDrawing({ map, stateManager, eventBus });
            }
            throw new Error('DataDrawing class not available');
        });

        // Register UI Services
        this.container.registerSingleton('uiComponents', (container) => {
            if (typeof UIComponents !== 'undefined') {
                const map = container.get('map');
                const stateManager = container.get('stateManager');
                const eventBus = container.get('eventBus');

                return new UIComponents({ map, stateManager, eventBus });
            }
            throw new Error('UIComponents class not available');
        });

        this.container.registerSingleton('labelManager', (container) => {
            if (typeof LabelManager !== 'undefined') {
                const map = container.get('map');
                return new LabelManager(map);
            }
            throw new Error('LabelManager class not available');
        });

        // Register Feature Services
        this.container.registerSingleton('timelineManager', (container) => {
            if (typeof TimelineManager !== 'undefined') {
                const map = container.get('map');
                return new TimelineManager(map);
            }
            throw new Error('TimelineManager class not available');
        });

        this.container.registerSingleton('visualizationManager', (container) => {
            if (typeof VisualizationManager !== 'undefined') {
                const map = container.get('map');
                const dataManager = container.get('dataManager');
                return new VisualizationManager(map, dataManager);
            }
            throw new Error('VisualizationManager class not available');
        });

        // Register Import/Export Services
        this.container.registerSingleton('importExport', (container) => {
            if (typeof ImportExport !== 'undefined') {
                const markerManager = container.get('markerManager');
                const dataManager = container.get('dataManager');
                const updateDataList = window.updateDataList;

                return new ImportExport({
                    markerManager,
                    dataManager,
                    map: container.get('map'),
                    stateManager: container.get('stateManager'),
                    eventBus: container.get('eventBus'),
                    updateDataListCallback: updateDataList
                });
            }
            throw new Error('ImportExport class not available');
        });

        this.container.registerSingleton('reportGeneration', () => {
            if (typeof ReportGeneration !== 'undefined') {
                return new ReportGeneration();
            }
            throw new Error('ReportGeneration class not available');
        });

        // Register Event Handlers
        this.container.registerSingleton('eventHandlers', (container) => {
            if (typeof EventHandlers !== 'undefined') {
                return new EventHandlers({
                    map: container.get('map'),
                    dataDrawing: container.get('drawingManager'),
                    markerManager: container.get('markerManager'),
                    importExport: container.get('importExport'),
                    reportGeneration: container.get('reportGeneration'),
                    uiComponents: container.get('uiComponents'),
                    userMarkers: window.userMarkers || [],
                    updateDataList: window.updateDataList,
                    clearAllMeasurements: window.clearAllMeasurements
                });
            }
            throw new Error('EventHandlers class not available');
        });

        _Logger.log('  ✓ Application services registered');
    }

    /**
     * Wire up integrations between core systems
     * @private
     */
    async _wireIntegrations() {
        // Wire StateManager changes to EventBus
        // When state changes, emit events
        const emitStateChange = (newValue, oldValue, path) => {
            this.events.emitSync('state:changed', { path, newValue, oldValue });
            this.events.emitSync(`state:changed:${path}`, { newValue, oldValue });
        };

        // Subscribe to important state paths
        this.state.subscribe('user.markers', (newValue, oldValue) => {
            emitStateChange(newValue, oldValue, 'user.markers');
        });

        this.state.subscribe('analysis', (newValue, oldValue) => {
            emitStateChange(newValue, oldValue, 'analysis');
        });

        this.state.subscribe('drawing', (newValue, oldValue) => {
            emitStateChange(newValue, oldValue, 'drawing');
        });

        _Logger.log('  ✓ System integrations wired');
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    window.ApplicationCore = ApplicationCore;
}
