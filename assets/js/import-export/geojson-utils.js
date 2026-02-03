/**
 * GeoJSON Utilities - GeoJSON Import/Export Helper Functions
 * Provides utilities for converting between marker format and GeoJSON
 */

/**
 * Convert markers array to GeoJSON FeatureCollection
 * @param {Array} markers - Array of marker objects
 * @returns {Object} - GeoJSON FeatureCollection with statistics
 */
function markersToGeoJSON(markers) {
    const stats = { point: 0, route: 0, area: 0, circle: 0 };

    const features = markers.map(marker => {
        let geometry;

        if (marker.type === 'circle' && typeof marker.radius === 'number') {
            // Circle as center point (with radius in properties)
            // Note: Can be converted to polygon with turf.buffer in external tools
            stats.circle++;
            geometry = {
                type: "Point",
                coordinates: [marker.lon, marker.lat]
            };
        } else if (marker.type === 'area' && marker.geometry && marker.geometry.length > 0) {
            stats.area++;
            const coordinates = marker.geometry.map(p => [p.lon, p.lat]);
            // Ensure ring is closed
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                coordinates.push(coordinates[0]);
            }
            geometry = {
                type: "Polygon",
                coordinates: [coordinates]
            };
        } else if (marker.type === 'route' && marker.geometry && marker.geometry.length > 0) {
            stats.route++;
            geometry = {
                type: "LineString",
                coordinates: marker.geometry.map(p => [p.lon, p.lat])
            };
        } else {
            stats.point++;
            geometry = {
                type: "Point",
                coordinates: [marker.lon, marker.lat]
            };
        }

        return {
            type: "Feature",
            geometry: geometry,
            properties: {
                name: marker.name,
                type: marker.type || 'point',
                // Circle-specific properties
                ...(marker.type === 'circle' ? {
                    circle: true,
                    radius: marker.radius,
                    centerLat: marker.lat,
                    centerLon: marker.lon
                } : {})
            }
        };
    });

    return {
        geoJSON: {
            type: "FeatureCollection",
            features: features
        },
        stats: stats
    };
}

/**
 * Convert GeoJSON feature to marker object
 * @param {Object} feature - GeoJSON feature
 * @param {string} defaultName - Default name if none provided
 * @returns {Object} - Marker object
 */
function featureToMarker(feature, defaultName = 'Unnamed') {
    const props = feature.properties || {};
    const geometry = feature.geometry;

    // Base marker object
    const marker = {
        name: props.name || defaultName,
        id: props.id || `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Handle different geometry types
    switch (geometry.type) {
        case 'Point':
            // Check if it's a circle (from our own export)
            if (props.circle === true && typeof props.radius === 'number') {
                marker.type = 'circle';
                marker.lat = geometry.coordinates[1];
                marker.lon = geometry.coordinates[0];
                marker.radius = props.radius;
            } else {
                marker.type = 'point';
                marker.lat = geometry.coordinates[1];
                marker.lon = geometry.coordinates[0];
            }
            break;

        case 'LineString':
            marker.type = 'route';
            marker.geometry = geometry.coordinates.map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));
            // Set center to first point
            if (geometry.coordinates.length > 0) {
                marker.lat = geometry.coordinates[0][1];
                marker.lon = geometry.coordinates[0][0];
            }
            break;

        case 'Polygon': {
            marker.type = 'area';
            // Use outer ring (first ring)
            marker.geometry = geometry.coordinates[0].map(coord => ({
                lat: coord[1],
                lon: coord[0]
            }));
            // Calculate centroid for lat/lon
            const centroid = calculateCentroid(geometry.coordinates[0]);
            marker.lat = centroid.lat;
            marker.lon = centroid.lon;
            break;
        }

        case 'MultiPoint':
        case 'MultiLineString':
        case 'MultiPolygon':
            if (window.Logger && typeof window.Logger.warn === 'function') { window.Logger.warn(`Multi-geometry type ${geometry.type} not fully supported, using first geometry`); } else { console.warn(`Multi-geometry type ${geometry.type} not fully supported, using first geometry`); }
            // Take first geometry for now
            if (geometry.coordinates.length > 0) {
                marker.type = 'point';
                const firstCoord = geometry.coordinates[0];
                if (Array.isArray(firstCoord) && firstCoord.length >= 2) {
                    marker.lat = firstCoord[1];
                    marker.lon = firstCoord[0];
                }
            }
            break;

        default:
            if (window.Logger && typeof window.Logger.warn === 'function') { window.Logger.warn(`Unknown geometry type: ${geometry.type}`); } else { console.warn(`Unknown geometry type: ${geometry.type}`); }
            marker.type = 'point';
            marker.lat = 0;
            marker.lon = 0;
    }

    return marker;
}

/**
 * Calculate centroid of a polygon ring
 * @param {Array} ring - Array of [lon, lat] coordinates
 * @returns {Object} - {lat, lon}
 */
function calculateCentroid(ring) {
    let sumLat = 0;
    let sumLon = 0;
    let count = ring.length;

    ring.forEach(coord => {
        sumLon += coord[0];
        sumLat += coord[1];
    });

    return {
        lat: sumLat / count,
        lon: sumLon / count
    };
}

/**
 * Validate GeoJSON structure
 * @param {Object} geoJSON - GeoJSON object to validate
 * @returns {Object} - {valid: boolean, message: string, featureCount: number}
 */
function validateGeoJSON(geoJSON) {
    if (!geoJSON || typeof geoJSON !== 'object') {
        return { valid: false, message: 'GeoJSON geçerli bir nesne değil', featureCount: 0 };
    }

    // Check type
    if (geoJSON.type === 'FeatureCollection') {
        if (!Array.isArray(geoJSON.features)) {
            return { valid: false, message: 'FeatureCollection features dizisi içermelidir', featureCount: 0 };
        }
        return {
            valid: true,
            message: 'Geçerli FeatureCollection',
            featureCount: geoJSON.features.length
        };
    } else if (geoJSON.type === 'Feature') {
        if (!geoJSON.geometry) {
            return { valid: false, message: 'Feature geometry içermelidir', featureCount: 0 };
        }
        return {
            valid: true,
            message: 'Geçerli Feature',
            featureCount: 1
        };
    } else {
        return {
            valid: false,
            message: `Desteklenmeyen GeoJSON tipi: ${geoJSON.type}`,
            featureCount: 0
        };
    }
}

/**
 * Normalize GeoJSON to FeatureCollection
 * Converts single Feature or other formats to FeatureCollection
 * @param {Object} geoJSON - GeoJSON object
 * @returns {Object} - FeatureCollection
 */
function normalizeToFeatureCollection(geoJSON) {
    if (geoJSON.type === 'FeatureCollection') {
        return geoJSON;
    } else if (geoJSON.type === 'Feature') {
        return {
            type: 'FeatureCollection',
            features: [geoJSON]
        };
    } else if (geoJSON.type && geoJSON.coordinates) {
        // Raw geometry
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: geoJSON,
                properties: {}
            }]
        };
    } else {
        throw new Error('Invalid GeoJSON format');
    }
}

/**
 * Generate export statistics message
 * @param {Object} stats - Statistics object {point, route, area, circle}
 * @returns {string} - Formatted message
 */
function formatExportStats(stats) {
    let message = `🗺️ GeoJSON export edildi: ${stats.point} nokta`;
    if (stats.route > 0) message += `, ${stats.route} çizgi`;
    if (stats.area > 0) message += `, ${stats.area} alan`;
    if (stats.circle > 0) message += `, ${stats.circle} çember`;
    message += '. QGIS, ArcGIS ve Atlas.Harita.Gov.TR\'de kullanabilirsiniz.';
    return message;
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.GeoJSONUtils = {
        markersToGeoJSON,
        featureToMarker,
        validateGeoJSON,
        normalizeToFeatureCollection,
        formatExportStats
    };

    // Export individual items for tests
    window.markersToGeoJSON = markersToGeoJSON;
}
