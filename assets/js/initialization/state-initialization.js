/**
 * State Initialization Module
 * Defines all global state variables for the application
 * Part of the modularized initialization system
 */

/**
 * Initialize global state variables
 * This should be called first, before any other initialization
 */
function initializeGlobalState() {
    // User data
    window.userMarkers = window.userMarkers || []; // Kullanıcının eklediği verileri saklamak için dizi (backward compatibility)
    window.measurements = window.measurements || []; // Ölçüm sonuçları
    window.catalogGeometryLayers = window.catalogGeometryLayers || [];

    // Dataset management (multiple datasets support)
    window.dataSets = window.dataSets || []; // Array of imported datasets
    window.activeDataSetId = null; // Currently active/selected dataset

    // Drawing state
    window.isDrawing = false;
    window.currentTool = null;

    // Buffer toggle durumu
    window.bufferActive = false;
    window.lastBufferRadius = null;
    window.bufferLabelMarkers = window.bufferLabelMarkers || [];

    // Analiz araçları durum takibi
    window.analysisStates = {
        convex: false,
        voronoi: false,
        nearest: false
    };

    // MapLibre GL JS specific: Track markers and layers
    window.mapMarkers = []; // Array to store maplibregl.Marker instances
    window.clusteringEnabled = false;

    if (window.Logger && typeof window.Logger.log === 'function') {
        window.Logger.log('✅ Global state initialized');
    } else {
        console.log('✅ Global state initialized');
    }
}

/**
 * Dataset Management Helper Functions
 */

// Add a new dataset
window.addDataSet = function(dataSet) {
    const id = dataSet.id || `dataset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newDataSet = {
        id: id,
        name: dataSet.name || 'Isimsiz Veri',
        fileName: dataSet.fileName || '',
        type: dataSet.type || 'unknown',
        markers: dataSet.markers || [],
        fields: dataSet.fields || [],
        visible: dataSet.visible !== undefined ? dataSet.visible : true,
        timestamp: Date.now()
    };

    window.dataSets.push(newDataSet);

    // Set as active if this is the first dataset or if specified
    if (!window.activeDataSetId || dataSet.setAsActive) {
        window.activeDataSetId = id;
    }

    // Also add to window.userMarkers for backward compatibility
    window.userMarkers.push(...newDataSet.markers);

    console.log(`✅ Dataset added: ${newDataSet.name} (${newDataSet.markers.length} markers)`);
    return newDataSet;
};

// Get dataset by ID
window.getDataSet = function(id) {
    return window.dataSets.find(ds => ds.id === id);
};

// Get active dataset
window.getActiveDataSet = function() {
    return window.getDataSet(window.activeDataSetId);
};

// Remove dataset by ID
window.removeDataSet = function(id) {
    const index = window.dataSets.findIndex(ds => ds.id === id);
    if (index !== -1) {
        const removed = window.dataSets.splice(index, 1)[0];

        // Remove markers from window.userMarkers
        removed.markers.forEach(marker => {
            const idx = window.userMarkers.findIndex(m => m.id === marker.id);
            if (idx !== -1) {
                window.userMarkers.splice(idx, 1);
            }
        });

        // If active dataset was removed, set next one as active
        if (window.activeDataSetId === id) {
            window.activeDataSetId = window.dataSets.length > 0 ? window.dataSets[0].id : null;
        }

        // Update map to reflect the removal
        if (typeof window.updateMapWithDataSets === 'function') {
            window.updateMapWithDataSets();
        }

        console.log(`✅ Dataset removed: ${removed.name}`);
        return removed;
    }
    return null;
};

// Update map to show only visible datasets
window.updateMapWithDataSets = function() {
    if (!window.map) return;

    // Get all visible markers from all visible datasets
    const visibleMarkers = window.dataSets
        .filter(ds => ds.visible !== false)
        .flatMap(ds => ds.markers);

    console.log(`🔄 Updating map with ${visibleMarkers.length} visible markers from ${window.dataSets.filter(ds => ds.visible !== false).length} datasets`);

    // Update markers source if it exists (works for both clustered and non-clustered)
    const source = window.map.getSource('markers');
    if (source) {
        const clusterFeatures = visibleMarkers.map(m => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [m.lon, m.lat]
            },
            properties: {
                id: m.id,
                name: m.name,
                type: m.type,
                // Include all properties for labels and popups
                ...m.properties
            }
        }));

        source.setData({
            type: 'FeatureCollection',
            features: clusterFeatures
        });

        console.log(`✅ Cluster source updated with ${clusterFeatures.length} points`);
    }

    // TODO: Also update HTML markers if not using clustering
};

// Set active dataset
window.setActiveDataSet = function(id) {
    if (window.getDataSet(id)) {
        window.activeDataSetId = id;
        console.log(`✅ Active dataset: ${window.getDataSet(id).name}`);
        return true;
    }
    return false;
};

// Show only selected dataset, hide others
window.showOnlyDataSet = function(id) {
    window.dataSets.forEach(ds => {
        ds.visible = (ds.id === id);
    });

    // Update map
    if (typeof window.updateMapWithDataSets === 'function') {
        window.updateMapWithDataSets();
    }

    const dataset = window.getDataSet(id);
    console.log(`👁️ Showing only: ${dataset.name}, hiding ${window.dataSets.length - 1} others`);
};

// Show all datasets
window.showAllDataSets = function() {
    window.dataSets.forEach(ds => {
        ds.visible = true;
    });

    // Update map
    if (typeof window.updateMapWithDataSets === 'function') {
        window.updateMapWithDataSets();
    }

    console.log(`👁️ Showing all ${window.dataSets.length} datasets`);
};

// Make it globally available
window.initializeGlobalState = initializeGlobalState;
