/**
 * Geometry Helpers - Spatial Analysis Utility Functions
 * General purpose geometry and marker utilities
 */

/**
 * Get visible markers from the map
 * Returns markers that are currently displayed on the map
 * Handles clustering mode and regular marker display
 * @returns {Array} - Array of visible marker data objects
 */
function getVisibleMarkersFromMap() {
    const visibleMarkers = [];

    // 🚀 PERFORMANCE: If clustering is active, use window.userMarkers
    if (window.clusteringEnabled) {
        // When clustering is active, there are no DOM markers, use userMarkers directly
        return window.userMarkers || [];
    }

    // 1. Get point markers from the map (from window.markerManager.markers Map)
    if (window.markerManager && window.markerManager.markers) {
        window.markerManager.markers.forEach((marker, id) => {
            // Find corresponding data in window.userMarkers
            const markerData = window.userMarkers.find(m => m.id === id);
            if (markerData) {
                visibleMarkers.push(markerData);
            }
        });
    }

    // 2. Get geometries from the map (area, route, circle)
    if (window.markerManager && window.markerManager.geometries) {
        window.markerManager.geometries.forEach(geometryId => {
            const geometryData = window.userMarkers.find(m => m.id === geometryId);
            if (geometryData && !visibleMarkers.find(m => m.id === geometryId)) {
                visibleMarkers.push(geometryData);
            }
        });
    }

    // 3. If no markers found but userMarkers exists, use it
    if (visibleMarkers.length === 0 && window.userMarkers && window.userMarkers.length > 0) {
        return window.userMarkers;
    }

    return visibleMarkers;
}

/**
 * Show minimal notification message
 * Uses window.showFeedback if available
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Display duration in milliseconds
 */
function showMinimalNotification(message, type = 'warning', duration = 3000) {
    if (typeof window.showFeedback === 'function') {
        window.showFeedback(message, type, duration);
    } else {
        Logger.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Convert markers to GeoJSON FeatureCollection
 * @param {Array} markers - Array of marker objects
 * @returns {Object} - GeoJSON FeatureCollection
 */
function markersToGeoJSON(markers) {
    const features = markers.map(marker => {
        // Handle both point markers and geometries
        if (marker.geometry) {
            // Already has geometry (drawn shapes, routes, etc.)
            return {
                type: 'Feature',
                geometry: marker.geometry,
                properties: {
                    id: marker.id,
                    name: marker.name || 'Unnamed',
                    description: marker.description || '',
                    ...marker.properties
                }
            };
        } else if (marker.coordinates) {
            // Point marker
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: marker.coordinates
                },
                properties: {
                    id: marker.id,
                    name: marker.name || 'Unnamed',
                    description: marker.description || '',
                    ...marker.properties
                }
            };
        }
        return null;
    }).filter(f => f !== null);

    return {
        type: 'FeatureCollection',
        features: features
    };
}

/**
 * Hide original markers from the map
 * Used when displaying clustering or heatmap
 */
function hideOriginalMarkers() {
    if (window.markerManager && window.markerManager.markers) {
        window.markerManager.markers.forEach(marker => {
            if (marker.getElement()) {
                marker.getElement().style.display = 'none';
            }
        });
    }
}

/**
 * Show original markers on the map
 * Restores marker visibility after clustering or heatmap is disabled
 */
function showOriginalMarkers() {
    if (window.markerManager && window.markerManager.markers) {
        window.markerManager.markers.forEach(marker => {
            if (marker.getElement()) {
                marker.getElement().style.display = '';
            }
        });
    }
}

/**
 * Calculate bounding box for a set of features
 * @param {Array} features - Array of GeoJSON features
 * @returns {Array|null} - Bounding box [minLng, minLat, maxLng, maxLat] or null
 */
function calculateBounds(features) {
    if (!features || features.length === 0) return null;

    try {
        // Use turf.js if available
        if (typeof turf !== 'undefined' && turf.bbox) {
            const featureCollection = {
                type: 'FeatureCollection',
                features: features
            };
            return turf.bbox(featureCollection);
        }

        // Fallback: manual calculation
        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;

        features.forEach(feature => {
            const coords = feature.geometry.coordinates;

            if (feature.geometry.type === 'Point') {
                const [lng, lat] = coords;
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
            } else if (feature.geometry.type === 'Polygon') {
                coords[0].forEach(([lng, lat]) => {
                    minLng = Math.min(minLng, lng);
                    minLat = Math.min(minLat, lat);
                    maxLng = Math.max(maxLng, lng);
                    maxLat = Math.max(maxLat, lat);
                });
            }
            // Add more geometry types as needed
        });

        return [minLng, minLat, maxLng, maxLat];
    } catch (error) {
        Logger.error('Error calculating bounds:', error);
        return null;
    }
}

/**
 * Fit map to bounds with padding
 * @param {Object} map - MapLibre map instance
 * @param {Array} bounds - Bounding box [minLng, minLat, maxLng, maxLat]
 * @param {Object} options - Fit bounds options
 */
function fitMapToBounds(map, bounds, options = {}) {
    if (!map || !bounds) return;

    const defaultOptions = {
        padding: 50,
        maxZoom: 15,
        duration: 1000
    };

    map.fitBounds(bounds, { ...defaultOptions, ...options });
}

/**
 * Check if a point is valid (has valid coordinates)
 * @param {Object} point - Point object with coordinates property
 * @returns {boolean} - True if point is valid
 */
function isValidPoint(point) {
    if (!point || !point.coordinates) return false;
    const [lng, lat] = point.coordinates;
    return typeof lng === 'number' && typeof lat === 'number' &&
           !isNaN(lng) && !isNaN(lat) &&
           Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.GeometryHelpers = {
        getVisibleMarkersFromMap,
        showMinimalNotification,
        markersToGeoJSON,
        hideOriginalMarkers,
        showOriginalMarkers,
        calculateBounds,
        fitMapToBounds,
        isValidPoint
    };
}
