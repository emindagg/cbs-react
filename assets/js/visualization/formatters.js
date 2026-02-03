/**
 * Formatters - Number Formatting Utilities
 * Provides number formatting functions for legends and labels
 */

/**
 * Format a value based on the format mode
 * @param {number} value - The value to format
 * @param {string} mode - Format mode: 'auto', 'full', 'compact'
 * @param {number} precision - Decimal precision
 * @param {boolean} isRangeContext - If true, use compact format; if false, use full format
 * @returns {string} - Formatted value string
 */
function formatLegendValue(value, mode = 'auto', precision = 1, isRangeContext = true) {
    // Handle exact zero
    if (value === 0) return '0';

    switch(mode) {
        case 'full':
            // Full numbers with thousand separators
            return new Intl.NumberFormat('tr-TR', {
                maximumFractionDigits: 0
            }).format(Math.round(value));

        case 'compact':
            // Compact notation (native browser support)
            if (Intl.NumberFormat.prototype.formatToParts) {
                return new Intl.NumberFormat('tr-TR', {
                    notation: 'compact',
                    compactDisplay: 'short',
                    maximumFractionDigits: precision
                }).format(value);
            }
            // Fallback to auto mode
            return formatAuto(value, precision, isRangeContext);

        case 'auto':
        default:
            return formatAuto(value, precision, isRangeContext);
    }
}

/**
 * Auto format with K/M/B suffixes
 * @param {number} value - The value to format
 * @param {number} precision - Decimal precision
 * @param {boolean} isRangeContext - If true (ranges), use K/M; if false (labels), use full numbers
 * @returns {string} - Formatted value string
 */
function formatAuto(value, precision = 1, isRangeContext = true) {
    const absValue = Math.abs(value);

    // For 'labels' mode (single values), show full numbers with separators
    if (!isRangeContext) {
        return new Intl.NumberFormat('tr-TR', {
            maximumFractionDigits: 0
        }).format(Math.round(value));
    }

    // For 'ranges' mode (intervals), use compact K/M/B format
    if (absValue >= 1000000000) {
        return `${(value / 1000000000).toFixed(precision)}B`;
    } else if (absValue >= 1000000) {
        return `${(value / 1000000).toFixed(precision)}M`;
    } else if (absValue >= 10000) {
        // 10,000+ uses K format
        return `${(value / 1000).toFixed(precision)}K`;
    } else if (absValue >= 1000) {
        // 1,000-9,999: show with thousand separator for clarity
        return new Intl.NumberFormat('tr-TR', {
            maximumFractionDigits: 0
        }).format(Math.round(value));
    }

    // For decimal numbers
    if (absValue < 1 && absValue > 0) {
        return value.toFixed(precision + 1);
    }

    // Small whole numbers (0-999): show as-is
    return Math.round(value).toString();
}

/**
 * Format with thousand separators (Turkish locale)
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted value string
 */
function formatWithSeparators(value, decimals = 0) {
    return new Intl.NumberFormat('tr-TR', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals
    }).format(value);
}

/**
 * Format as percentage
 * @param {number} value - The value to format (0-1 or 0-100)
 * @param {boolean} isDecimal - If true, value is 0-1; if false, value is 0-100
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
function formatPercentage(value, isDecimal = true, decimals = 1) {
    const percentage = isDecimal ? value * 100 : value;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format area value (with m², km², ha units)
 * @param {number} areaInSquareMeters - Area in square meters
 * @param {string} preferredUnit - Preferred unit: 'm2', 'ha', 'km2', 'auto'
 * @returns {string} - Formatted area string with unit
 */
function formatArea(areaInSquareMeters, preferredUnit = 'auto') {
    if (preferredUnit === 'auto') {
        if (areaInSquareMeters < 10000) {
            // Less than 1 hectare -> use m²
            return `${formatWithSeparators(areaInSquareMeters, 0)} m²`;
        } else if (areaInSquareMeters < 1000000) {
            // Less than 1 km² -> use hectares
            const hectares = areaInSquareMeters / 10000;
            return `${formatWithSeparators(hectares, 2)} ha`;
        } else {
            // 1 km² or more -> use km²
            const km2 = areaInSquareMeters / 1000000;
            return `${formatWithSeparators(km2, 2)} km²`;
        }
    }

    switch(preferredUnit) {
        case 'm2':
            return `${formatWithSeparators(areaInSquareMeters, 0)} m²`;
        case 'ha':
            return `${formatWithSeparators(areaInSquareMeters / 10000, 2)} ha`;
        case 'km2':
            return `${formatWithSeparators(areaInSquareMeters / 1000000, 2)} km²`;
        default:
            return `${formatWithSeparators(areaInSquareMeters, 0)} m²`;
    }
}

/**
 * Format distance value (with m, km units)
 * @param {number} distanceInMeters - Distance in meters
 * @returns {string} - Formatted distance string with unit
 */
function formatDistance(distanceInMeters) {
    if (distanceInMeters < 1000) {
        return `${formatWithSeparators(distanceInMeters, 0)} m`;
    } else {
        const km = distanceInMeters / 1000;
        return `${formatWithSeparators(km, 2)} km`;
    }
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.VisualizationFormatters = {
        formatLegendValue,
        formatAuto,
        formatWithSeparators,
        formatPercentage,
        formatArea,
        formatDistance
    };

    // Export individual items for tests
    window.formatLegendValue = formatLegendValue;
}
