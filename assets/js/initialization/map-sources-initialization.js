/**
 * Map Sources Initialization Module
 * Defines all GeoJSON data sources for the map
 * Part of the modularized initialization system
 */

/**
 * Initialize map data sources
 * Creates empty GeoJSON sources for: markers, geometries, measurements, buffers, analysis
 */
function initializeMapSources() {
    window.dataSources = {
        markers: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            },
            cluster: false // Will be enabled when clustering is activated
        },
        catalogGeometries: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        measurements: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        buffers: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        convexHull: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        voronoi: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        nearestFacility: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        },
        heatmap: {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        }
    };

    if (window.Logger && typeof window.Logger.log === 'function') {
        window.Logger.log('✅ Map sources initialized');
    } else {
        console.log('✅ Map sources initialized');
    }
}

// Make it globally available
window.initializeMapSources = initializeMapSources;
