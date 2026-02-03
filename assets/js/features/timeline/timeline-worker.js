/**
 * Timeline Web Worker
 * Background thread for filtering large datasets
 */

// Date parsing cache
const dateCache = new Map();

/**
 * Parse date string to Date object (with cache)
 */
function parseDate(dateString) {
    if (!dateString) return null;

    // Already a timestamp?
    if (typeof dateString === 'number') {
        return new Date(dateString);
    }

    // Already a Date object?
    if (dateString instanceof Date) return dateString;

    // Check cache
    if (dateCache.has(dateString)) {
        return dateCache.get(dateString);
    }

    let parsedDate;

    // Turkish format: DD/MM/YYYY HH:mm:ss or DD/MM/YYYY
    if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split(' ');
        const datePart = parts[0]; // DD/MM/YYYY
        const timePart = parts[1] || '00:00:00'; // HH:mm:ss

        const [day, month, year] = datePart.split('/');
        const [hours, minutes, seconds] = timePart.split(':');

        parsedDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hours) || 0,
            parseInt(minutes) || 0,
            parseInt(seconds) || 0
        );
    } else {
        // ISO format or Unix timestamp
        parsedDate = new Date(dateString);
    }

    // Cache result (limit to 10000 to prevent memory issues)
    if (dateCache.size < 10000) {
        dateCache.set(dateString, parsedDate);
    }

    return parsedDate;
}

/**
 * Get date value from feature properties
 */
function getFeatureDateValue(feature) {
    if (!feature.properties) return null;
    return feature.properties.timestamp ||
           feature.properties.time ||
           feature.properties.Date ||
           feature.properties.date ||
           feature.properties.tarih;
}

/**
 * Filter feature by date
 */
function filterFeatureByDate(featureDate, currentDate, previousDate, filterMode) {
    if (!featureDate) return true;

    if (filterMode === 'cumulative') {
        return featureDate <= currentDate;
    } else {
        // In interval mode, if previousDate is null, show all features up to currentDate
        if (!previousDate) {
            return featureDate <= currentDate;
        }
        return featureDate > previousDate && featureDate <= currentDate;
    }
}

/**
 * Filter feature by property value
 */
function filterFeatureByProperty(propertyValue, selectedProperty, propertyMin, propertyMax) {
    if (!selectedProperty) return true;

    const numValue = parseFloat(propertyValue);
    if (!isNaN(numValue) && isFinite(numValue)) {
        return numValue >= propertyMin && numValue <= propertyMax;
    }
    return false;
}

/**
 * Main filtering function
 */
function filterFeatures(data) {
    const {
        features,
        currentDate: currentDateTs,
        previousDate: previousDateTs,
        filterMode,
        selectedProperty,
        propertyMin,
        propertyMax
    } = data;

    // Convert timestamps to Date objects
    const currentDate = new Date(currentDateTs);
    const previousDate = previousDateTs !== null ? new Date(previousDateTs) : null;

    const startTime = performance.now();

    // Create ID map for faster lookups (if needed in future)
    // For now, we're working directly with features

    const filteredFeatures = [];
    let dateFilterCount = 0;
    let propertyFilterCount = 0;

    for (let i = 0; i < features.length; i++) {
        const feature = features[i];

        // Get date value
        const dateValue = getFeatureDateValue(feature);
        if (!dateValue) {
            filteredFeatures.push(feature);
            continue;
        }

        // Parse and filter by date
        const featureDate = parseDate(dateValue);
        const dateResult = filterFeatureByDate(featureDate, currentDate, previousDate, filterMode);

        if (!dateResult) {
            dateFilterCount++;
            continue;
        }

        // Filter by property
        if (selectedProperty) {
            const propertyValue = feature.properties[selectedProperty];
            const propResult = filterFeatureByProperty(propertyValue, selectedProperty, propertyMin, propertyMax);

            if (!propResult) {
                propertyFilterCount++;
                continue;
            }
        }

        // Feature passed all filters
        filteredFeatures.push(feature);
    }

    const filterTime = performance.now() - startTime;

    return {
        filteredFeatures,
        stats: {
            originalCount: features.length,
            filteredCount: filteredFeatures.length,
            dateFilterCount,
            propertyFilterCount,
            filterTime
        }
    };
}

/**
 * Message handler
 */
self.onmessage = function(e) {
    const { type, data, requestId } = e.data;

    try {
        if (type === 'FILTER') {
            const result = filterFeatures(data);

            self.postMessage({
                type: 'FILTER_RESULT',
                requestId,
                data: result
            });
        } else if (type === 'CLEAR_CACHE') {
            dateCache.clear();
            self.postMessage({
                type: 'CACHE_CLEARED',
                requestId
            });
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            requestId,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
};

// Worker ready
self.postMessage({ type: 'READY' });
