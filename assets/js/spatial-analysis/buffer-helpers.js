/**
 * Buffer Helpers - Buffer Analysis Utilities
 * Helper functions for buffer analysis operations
 */

/**
 * Buffer analysis modes
 */
const BUFFER_MODES = {
    NORMAL: 'normal',        // Regular overlapping buffers
    UNION: 'union',          // Merge overlapping buffers
    INTERSECTION: 'intersection',  // Only show intersections
    DIFFERENCE: 'difference' // Show non-overlapping areas
};

/**
 * Buffer mode colors
 */
const BUFFER_MODE_COLORS = {
    normal: '#10b981',       // Emerald
    union: '#3b82f6',        // Blue
    intersection: '#f59e0b', // Amber/Orange
    difference: '#8b5cf6'    // Purple
};

/**
 * Get color for buffer mode
 * @param {string} mode - Buffer mode
 * @returns {string} - Hex color code
 */
function getBufferModeColor(mode) {
    return BUFFER_MODE_COLORS[mode] || BUFFER_MODE_COLORS.normal;
}

/**
 * Get buffer mode display name
 * @param {string} mode - Buffer mode
 * @returns {string} - Display name in Turkish
 */
function getBufferModeName(mode) {
    const names = {
        normal: 'Normal (Çakışmalı)',
        union: 'Birleşim (Union)',
        intersection: 'Kesişim (Intersection)',
        difference: 'Fark (Difference)'
    };
    return names[mode] || 'Normal';
}

/**
 * Calculate buffer statistics for a set of buffers
 * @param {Array} buffers - Array of buffer features (Turf.js features)
 * @returns {Object} - Statistics object
 */
function calculateBufferStatistics(buffers) {
    if (!buffers || buffers.length === 0) {
        return null;
    }

    if (typeof turf === 'undefined') {
        Logger.error('Turf.js is required for buffer statistics');
        return null;
    }

    let totalArea = 0;
    let overlappingPairs = 0;
    let totalOverlapArea = 0;

    // Calculate total area
    buffers.forEach(buffer => {
        totalArea += turf.area(buffer);
    });

    // Check for overlaps
    for (let i = 0; i < buffers.length; i++) {
        for (let j = i + 1; j < buffers.length; j++) {
            try {
                const intersection = turf.intersect(buffers[i], buffers[j]);
                if (intersection) {
                    overlappingPairs++;
                    totalOverlapArea += turf.area(intersection);
                }
            } catch (error) {
                // Ignore intersection errors
            }
        }
    }

    // Calculate union area
    let unionArea = 0;
    try {
        let union = buffers[0];
        for (let i = 1; i < buffers.length; i++) {
            union = turf.union(union, buffers[i]);
        }
        unionArea = turf.area(union);
    } catch (error) {
        Logger.error('Error calculating union:', error);
        unionArea = totalArea; // Fallback
    }

    // Calculate coverage efficiency
    const coverageEfficiency = unionArea > 0 ? (unionArea / totalArea) * 100 : 0;

    return {
        bufferCount: buffers.length,
        totalArea: totalArea,
        unionArea: unionArea,
        totalOverlapArea: totalOverlapArea,
        overlappingPairs: overlappingPairs,
        coverageEfficiency: coverageEfficiency,
        redundancy: totalArea > unionArea ? ((totalArea - unionArea) / totalArea) * 100 : 0
    };
}

/**
 * Create union of buffers (merge overlapping buffers)
 * @param {Array} buffers - Array of buffer features
 * @returns {Object|null} - Union feature or null
 */
function createUnionBuffers(buffers) {
    if (!buffers || buffers.length === 0) return null;
    if (typeof turf === 'undefined') {
        Logger.error('Turf.js is required for buffer union');
        return null;
    }

    try {
        let union = buffers[0];
        for (let i = 1; i < buffers.length; i++) {
            union = turf.union(union, buffers[i]);
        }
        return union;
    } catch (error) {
        Logger.error('Error creating union:', error);
        return null;
    }
}

/**
 * Create intersection of buffers (only overlapping areas)
 * @param {Array} buffers - Array of buffer features
 * @returns {Array} - Array of intersection features
 */
function createIntersectionBuffers(buffers) {
    if (!buffers || buffers.length < 2) return [];
    if (typeof turf === 'undefined') {
        Logger.error('Turf.js is required for buffer intersection');
        return [];
    }

    const intersections = [];

    for (let i = 0; i < buffers.length; i++) {
        for (let j = i + 1; j < buffers.length; j++) {
            try {
                const intersection = turf.intersect(buffers[i], buffers[j]);
                if (intersection) {
                    intersections.push(intersection);
                }
            } catch (error) {
                Logger.error('Error creating intersection:', error);
            }
        }
    }

    return intersections;
}

/**
 * Create difference of buffers (non-overlapping areas)
 * @param {Array} buffers - Array of buffer features
 * @returns {Array} - Array of difference features
 */
function createDifferenceBuffers(buffers) {
    if (!buffers || buffers.length === 0) return [];
    if (typeof turf === 'undefined') {
        Logger.error('Turf.js is required for buffer difference');
        return [];
    }

    const differences = [];

    buffers.forEach((buffer, index) => {
        try {
            let difference = buffer;

            // Subtract all other buffers from this one
            buffers.forEach((otherBuffer, otherIndex) => {
                if (index !== otherIndex) {
                    try {
                        const result = turf.difference(difference, otherBuffer);
                        if (result) {
                            difference = result;
                        }
                    } catch (error) {
                        // Continue with current difference
                    }
                }
            });

            // Only add if there's remaining area
            if (difference && turf.area(difference) > 1) { // More than 1 m²
                differences.push(difference);
            }
        } catch (error) {
            Logger.error('Error creating difference:', error);
        }
    });

    return differences;
}

/**
 * Format buffer statistics for display
 * @param {Object} stats - Statistics object from calculateBufferStatistics
 * @returns {Object} - Formatted statistics with display strings
 */
function formatBufferStatistics(stats) {
    if (!stats) return null;

    // Helper to format area (reuse from formatters if available)
    const formatArea = (areaM2) => {
        if (typeof window.VisualizationFormatters !== 'undefined' &&
            window.VisualizationFormatters.formatArea) {
            return window.VisualizationFormatters.formatArea(areaM2);
        }

        // Fallback formatting
        if (areaM2 < 10000) {
            return `${Math.round(areaM2)} m²`;
        } else if (areaM2 < 1000000) {
            return `${(areaM2 / 10000).toFixed(2)} ha`;
        } else {
            return `${(areaM2 / 1000000).toFixed(2)} km²`;
        }
    };

    return {
        bufferCount: `${stats.bufferCount} buffer`,
        totalArea: formatArea(stats.totalArea),
        unionArea: formatArea(stats.unionArea),
        totalOverlapArea: formatArea(stats.totalOverlapArea),
        overlappingPairs: `${stats.overlappingPairs} çift`,
        coverageEfficiency: `%${stats.coverageEfficiency.toFixed(1)}`,
        redundancy: `%${stats.redundancy.toFixed(1)}`
    };
}

/**
 * Create buffer GeoJSON for a single point
 * @param {Array} coordinates - [lng, lat]
 * @param {number} radius - Buffer radius in meters
 * @param {Object} properties - Feature properties
 * @returns {Object|null} - Buffer feature or null
 */
function createPointBuffer(coordinates, radius, properties = {}) {
    if (!coordinates || !radius || radius <= 0) return null;
    if (typeof turf === 'undefined') {
        Logger.error('Turf.js is required for buffer creation');
        return null;
    }

    try {
        const point = turf.point(coordinates);
        const buffer = turf.buffer(point, radius / 1000, { units: 'kilometers' });

        if (buffer) {
            buffer.properties = {
                ...properties,
                radius: radius,
                area: turf.area(buffer)
            };
        }

        return buffer;
    } catch (error) {
        Logger.error('Error creating buffer:', error);
        return null;
    }
}

/**
 * Validate buffer radius
 * @param {number} radius - Radius in meters
 * @returns {Object} - Validation result { valid: boolean, message: string }
 */
function validateBufferRadius(radius) {
    const MIN_RADIUS = 1; // 1 meter
    const MAX_RADIUS = 100000; // 100 km

    if (typeof radius !== 'number' || isNaN(radius)) {
        return { valid: false, message: 'Yarıçap sayı olmalıdır' };
    }

    if (radius < MIN_RADIUS) {
        return { valid: false, message: `Minimum yarıçap ${MIN_RADIUS} metredir` };
    }

    if (radius > MAX_RADIUS) {
        return { valid: false, message: `Maksimum yarıçap ${MAX_RADIUS / 1000} km'dir` };
    }

    return { valid: true, message: 'OK' };
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.BufferHelpers = {
        BUFFER_MODES,
        BUFFER_MODE_COLORS,
        getBufferModeColor,
        getBufferModeName,
        calculateBufferStatistics,
        createUnionBuffers,
        createIntersectionBuffers,
        createDifferenceBuffers,
        formatBufferStatistics,
        createPointBuffer,
        validateBufferRadius
    };

    // Export individual items for tests
    window.calculateBufferStatistics = calculateBufferStatistics;
    window.createUnionBuffers = createUnionBuffers;
}
