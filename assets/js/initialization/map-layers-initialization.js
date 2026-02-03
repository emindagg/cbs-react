/**
 * Map Layers Initialization Module
 * Creates all map layers when map is loaded
 * Part of the modularized initialization system
 */

// Safe Logger helpers
const safeLogLayers = (...args) => window.Logger?.log ? window.Logger.log(...args) : console.log(...args);
const safeErrorLayers = (...args) => window.Logger?.error ? window.Logger.error(...args) : console.error(...args);

/**
 * Initialize map layers
 * Creates layers for: catalog geometries, measurements, buffers
 * This function should be called on map 'load' event
 */
function initializeMapLayers() {
    if (!window.map || !window.dataSources) {
        safeErrorLayers('Map or data sources not initialized');
        return;
    }

    // Early DI registrations (before map 'load') to ensure VisualizationManager uses DI path
    if (window.ServiceLocator && window.map) {
        try {
            if (typeof DataManager !== 'undefined' && !window.ServiceLocator.has('dataManager')) {
                window.ServiceLocator.registerValue('dataManager', new DataManager());
                safeLogLayers('✅ DataManager registered in ServiceLocator (early)');
            }
            if (typeof VisualizationManager !== 'undefined' && !window.ServiceLocator.has('visualizationManager')) {
                const dm = window.ServiceLocator.has('dataManager') ? window.ServiceLocator.get('dataManager') : null;
                window.ServiceLocator.registerValue('visualizationManager', new VisualizationManager(window.map, dm));
                safeLogLayers('✅ VisualizationManager registered in ServiceLocator (early)');
            }
            // Early register TimelineManager so orchestrator uses DI path (prevents manual creation warning)
            if (typeof TimelineManager !== 'undefined' && !window.ServiceLocator.has('timelineManager')) {
                window.ServiceLocator.registerValue('timelineManager', new TimelineManager(window.map));
                safeLogLayers('✅ TimelineManager registered in ServiceLocator (early)');
            }
            // Early register LabelManager so labels-manager.js uses DI (prevents manual creation warning)
            if (typeof LabelManager !== 'undefined' && !window.ServiceLocator.has('labelManager')) {
                window.ServiceLocator.registerValue('labelManager', new LabelManager(window.map));
                safeLogLayers('✅ LabelManager registered in ServiceLocator (early)');
            }
        } catch (error) {
            safeErrorLayers('❌ Failed to early-register VisualizationManager:', error);
        }
    }

    window.map.on('load', () => {
        // Add catalog geometries source and layers
        window.map.addSource('catalog-geometries', window.dataSources.catalogGeometries);

        // İlk symbol layer'ı bul (catalog layer'ları symbol'ün altına eklemek için)
        const layers = window.map.getStyle().layers;
        const firstSymbolLayer = layers.find(l => l.type === 'symbol');
        const beforeId = firstSymbolLayer ? firstSymbolLayer.id : undefined;

        // Polygon fill layer
        window.map.addLayer({
            id: 'catalog-polygons',
            type: 'fill',
            source: 'catalog-geometries',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
                'fill-color': ['get', 'fillColor'],
                'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.3]
            }
        }, beforeId);

        // Polygon outline layer (solid lines - for circles)
        window.map.addLayer({
            id: 'catalog-polygon-outlines',
            type: 'line',
            source: 'catalog-geometries',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
                'line-color': ['get', 'strokeColor'],
                'line-width': ['coalesce', ['get', 'strokeWidth'], 2]
            }
        }, beforeId);

        // Polygon outline layer (dashed - for circles with dashArray property)
        window.map.addLayer({
            id: 'catalog-polygon-outlines-dashed',
            type: 'line',
            source: 'catalog-geometries',
            filter: ['all',
                ['==', ['geometry-type'], 'Polygon'],
                ['==', ['get', 'type'], 'circle']
            ],
            paint: {
                'line-color': ['get', 'strokeColor'],
                'line-width': ['coalesce', ['get', 'strokeWidth'], 2],
                'line-dasharray': [6, 4] // Sabit kesikli çizgi
            }
        }, beforeId);

        // LineString layer
        window.map.addLayer({
            id: 'catalog-lines',
            type: 'line',
            source: 'catalog-geometries',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
                'line-color': ['get', 'strokeColor'],
                'line-width': 2
            }
        }, beforeId);

        // Add measurements source and layers
        window.map.addSource('measurements', window.dataSources.measurements);

        // Measurement lines
        window.map.addLayer({
            id: 'measurement-lines',
            type: 'line',
            source: 'measurements',
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
                'line-color': '#ff0000',
                'line-width': 3,
                'line-dasharray': [2, 2]
            }
        });

        // Measurement polygons
        window.map.addLayer({
            id: 'measurement-polygons',
            type: 'fill',
            source: 'measurements',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
                'fill-color': '#22c55e',
                'fill-opacity': 0.3
            }
        });

        window.map.addLayer({
            id: 'measurement-polygon-outlines',
            type: 'line',
            source: 'measurements',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
                'line-color': '#22c55e',
                'line-width': 2
            }
        });

        // Add buffer source and layers
        window.map.addSource('buffers', window.dataSources.buffers);

        window.map.addLayer({
            id: 'buffer-fills',
            type: 'fill',
            source: 'buffers',
            paint: {
                'fill-color': '#9333ea',
                'fill-opacity': 0.3
            }
        });

        window.map.addLayer({
            id: 'buffer-outlines',
            type: 'line',
            source: 'buffers',
            paint: {
                'line-color': '#9333ea',
                'line-width': 2
            }
        });

        safeLogLayers('✅ Map layers initialized');

        // Register core services in ServiceLocator for DI-based initialization
        // This allows module-initialization.js to access these services
        if (window.ServiceLocator && window.map) {
            // Register UI Components
            if (typeof UIComponents !== 'undefined') {
                try {
                    const uiComponents = new UIComponents({
                        map: window.map,
                        stateManager: null,
                        eventBus: null
                    });
                    window.ServiceLocator.registerValue('uiComponents', uiComponents);
                    safeLogLayers('✅ UIComponents registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register UIComponents:', error);
                }
            }

            // Register Drawing Manager
            if (typeof DataDrawing !== 'undefined') {
                try {
                    const drawingManager = new DataDrawing({
                        map: window.map,
                        stateManager: null,
                        eventBus: null
                    });
                    window.ServiceLocator.registerValue('drawingManager', drawingManager);
                    safeLogLayers('✅ DrawingManager registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register DrawingManager:', error);
                }
            }

            // Register Marker Manager
            if (typeof MarkerManager !== 'undefined') {
                try {
                    const markerManager = new MarkerManager({
                        map: window.map,
                        stateManager: null,
                        eventBus: null
                    });
                    window.ServiceLocator.registerValue('markerManager', markerManager);
                    safeLogLayers('✅ MarkerManager registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register MarkerManager:', error);
                }
            }

            // Register DataManager (DI Container)
            if (typeof DataManager !== 'undefined' && !window.ServiceLocator.has('dataManager')) {
                try {
                    const dataManager = new DataManager();
                    window.ServiceLocator.registerValue('dataManager', dataManager);
                    safeLogLayers('✅ DataManager registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register DataManager:', error);
                }
            }

            // Register VisualizationManager (DI Container)
            if (typeof VisualizationManager !== 'undefined' && !window.ServiceLocator.has('visualizationManager')) {
                try {
                    const dm = window.ServiceLocator.has('dataManager') ? window.ServiceLocator.get('dataManager') : (typeof DataManager !== 'undefined' ? new DataManager() : null);
                    const vizManager = new VisualizationManager(window.map, dm);
                    window.ServiceLocator.registerValue('visualizationManager', vizManager);
                    safeLogLayers('✅ VisualizationManager registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register VisualizationManager:', error);
                }
            }

            
            // Register Import/Export if available
            if (typeof ImportExport !== 'undefined') {
                try {
                    const importExport = new ImportExport({
                        markerManager: window.ServiceLocator.get('markerManager'),
                        dataManager: null,
                        map: window.map,
                        stateManager: null,
                        eventBus: null,
                        updateDataListCallback: window.updateDataList
                    });
                    window.ServiceLocator.registerValue('importExport', importExport);
                    safeLogLayers('✅ ImportExport registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register ImportExport:', error);
                }
            }

            // Register Report Generation if available
            if (typeof ReportGeneration !== 'undefined') {
                try {
                    const reportGeneration = new ReportGeneration();
                    window.ServiceLocator.registerValue('reportGeneration', reportGeneration);
                    safeLogLayers('✅ ReportGeneration registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register ReportGeneration:', error);
                }
            }

            // Register Event Handlers (after ImportExport and ReportGeneration)
            if (typeof EventHandlers !== 'undefined') {
                try {
                    const eventHandlers = new EventHandlers({
                        map: window.map,
                        dataDrawing: window.ServiceLocator.get('drawingManager'),
                        markerManager: window.ServiceLocator.get('markerManager'),
                        importExport: window.ServiceLocator.has('importExport') ? window.ServiceLocator.get('importExport') : null,
                        reportGeneration: window.ServiceLocator.has('reportGeneration') ? window.ServiceLocator.get('reportGeneration') : null,
                        uiComponents: window.ServiceLocator.get('uiComponents'),
                        userMarkers: window.userMarkers || [],
                        updateDataList: window.updateDataList,
                        clearAllMeasurements: window.clearAllMeasurements
                    });
                    window.ServiceLocator.registerValue('eventHandlers', eventHandlers);
                    safeLogLayers('✅ EventHandlers registered in ServiceLocator');
                } catch (error) {
                    safeErrorLayers('❌ Failed to register EventHandlers:', error);
                }
            }
        }
    });
}

// Make it globally available
window.initializeMapLayers = initializeMapLayers;
