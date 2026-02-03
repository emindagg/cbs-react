/**
 * Classification Methods - Data Classification Algorithms
 * Provides statistical classification methods for choropleth maps
 */

// Güvenli Logger helper (warn)
const safeWarnClass = (...args) => (window.Logger && typeof window.Logger.warn === 'function') ? window.Logger.warn(...args) : console.warn(...args);

/**
 * Calculate variance for a subset of values
 * @param {Array<number>} values - Array of values
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {number} - Variance value
 */
function calculateVariance(values, start, end) {
    if (start >= end) return 0;

    const subset = values.slice(start, end + 1);
    const n = subset.length;

    if (n === 0) return 0;
    if (n === 1) return 0;

    const mean = subset.reduce((sum, val) => sum + val, 0) / n;
    const variance = subset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

    return variance;
}

/**
 * Round a number to a "nice" value (inspired by Datawrapper)
 * Returns nicely rounded numbers like 10, 20, 25, 50, 100, 200, 250, 500, etc.
 * @param {number} value - Value to round
 * @returns {number} - Rounded "nice" number
 */
function roundToNiceNumber(value) {
    if (value === 0) return 0;

    const isNegative = value < 0;
    const absValue = Math.abs(value);

    // Find the order of magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(absValue)));

    // Normalize to 1-10 range
    const normalized = absValue / magnitude;

    // Round to nice numbers in the 1-10 range
    let rounded;
    if (normalized <= 1) rounded = 1;
    else if (normalized <= 2) rounded = 2;
    else if (normalized <= 2.5) rounded = 2.5;
    else if (normalized <= 5) rounded = 5;
    else rounded = 10;

    // Scale back to original magnitude
    const result = rounded * magnitude;

    return isNegative ? -result : result;
}

/**
 * Jenks Natural Breaks (Fisher-Jenks) Algorithm
 * Minimizes variance within classes and maximizes variance between classes
 * @param {Array<number>} sortedValues - Pre-sorted array of values
 * @param {number} numClasses - Number of classes to create
 * @returns {Array<number>} - Array of break points
 */
function calculateJenksBreaks(sortedValues, numClasses) {
    const n = sortedValues.length;

    // Boundary case: if we have fewer unique values than classes
    const uniqueValues = [...new Set(sortedValues)].sort((a, b) => a - b);
    if (uniqueValues.length <= numClasses) {
        safeWarnClass(`⚠️ Jenks: ${uniqueValues.length} benzersiz değer var, ${numClasses} sınıf istendi. Quantile kullanılıyor.`);
        return calculateBreaks(sortedValues, 'quantile', numClasses);
    }

    // Boundary case: if we have fewer values than classes
    if (n <= numClasses) {
        return sortedValues;
    }

    // Initialize matrices
    const lowerClassLimits = [];
    const variance = [];

    // Initialize arrays
    for (let i = 0; i <= n; i++) {
        lowerClassLimits[i] = [];
        variance[i] = [];
        for (let j = 0; j <= numClasses; j++) {
            lowerClassLimits[i][j] = 0;
            variance[i][j] = 0;
        }
    }

    // Pre-compute sums and sum of squares for all ranges
    const sumSquares = [0];
    const sum = [0];

    for (let i = 0; i < n; i++) {
        sumSquares[i + 1] = sumSquares[i] + sortedValues[i] * sortedValues[i];
        sum[i + 1] = sum[i] + sortedValues[i];
    }

    // Initialize for 1 class
    for (let i = 1; i <= n; i++) {
        variance[i][1] = calculateVariance(sortedValues, 0, i - 1);
        lowerClassLimits[i][1] = 0;
    }

    // Fill matrices using dynamic programming
    for (let numClass = 2; numClass <= numClasses; numClass++) {
        for (let i = numClass; i <= n; i++) {
            variance[i][numClass] = Infinity;

            // Try all possible positions for the lower class limit
            for (let k = numClass - 1; k < i; k++) {
                // Calculate variance for this split
                const v1 = variance[k][numClass - 1];
                const v2 = calculateVariance(sortedValues, k, i - 1);
                const totalVariance = v1 + v2;

                // Keep the split with minimum variance
                if (totalVariance < variance[i][numClass]) {
                    variance[i][numClass] = totalVariance;
                    lowerClassLimits[i][numClass] = k;
                }
            }
        }
    }

    // Extract breaks from the matrices
    const breaks = [];
    let k = n;

    // Build breaks array from end to start
    for (let numClass = numClasses; numClass >= 2; numClass--) {
        const idx = lowerClassLimits[k][numClass];
        if (idx > 0 && idx < n) {
            breaks.push(sortedValues[idx]);
        }
        k = idx;
    }

    // Add min and max values
    breaks.reverse();
    breaks.unshift(sortedValues[0]);
    breaks.push(sortedValues[n - 1]);

    // Remove any duplicates and ensure sorted
    let uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);

    // Ensure we have exactly numClasses + 1 breaks
    if (uniqueBreaks.length < numClasses + 1) {
        safeWarnClass(`⚠️ Jenks: ${uniqueBreaks.length} kırılma noktası bulundu, ${numClasses + 1} gerekli. Quantile kullanılıyor.`);
        return calculateBreaks(sortedValues, 'quantile', numClasses);
    }

    // If we have more than needed, trim to exact count
    if (uniqueBreaks.length > numClasses + 1) {
        uniqueBreaks = uniqueBreaks.slice(0, numClasses + 1);
    }

    return uniqueBreaks;
}

/**
 * Calculate classification breaks using different methods
 * @param {Array<number>} values - Array of data values
 * @param {string} method - Classification method: 'equal', 'quantile', 'jenks', 'rounded', 'logarithmic', 'custom'
 * @param {number} classCount - Number of classes
 * @param {Array<number>} customBreaks - Custom breaks array (for 'custom' method)
 * @returns {Array<number>} - Array of break points
 */
function calculateBreaks(values, method, classCount, customBreaks = null) {
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Equal Interval (Eşit Aralık)
    if (method === 'equal' || method === 'equal-interval') {
        const step = (max - min) / classCount;
        return Array.from({ length: classCount + 1 }, (_, i) => min + i * step);
    }

    // Quantile (Yüzdelik Dilim)
    // Her sınıfta eşit sayıda gözlem olacak şekilde kırılma noktaları belirler
    else if (method === 'quantile') {
        const breaks = [min];
        for (let i = 1; i < classCount; i++) {
            const percentile = i / classCount;
            const index = percentile * (sorted.length - 1);
            const lower = Math.floor(index);
            const upper = Math.ceil(index);
            const weight = index - lower;

            // Linear interpolation for exact percentiles
            if (lower === upper) {
                breaks.push(sorted[lower]);
            } else {
                breaks.push(sorted[lower] * (1 - weight) + sorted[upper] * weight);
            }
        }
        breaks.push(max);
        return breaks;
    }

    // Jenks Natural Breaks (Doğal Kırılma)
    else if (method === 'jenks' || method === 'natural-breaks') {
        return calculateJenksBreaks(sorted, classCount);
    }

    // Rounded Values (Yuvarlanmış Değerler)
    // Datawrapper tarzı güzel yuvarlanmış sayılar üretir
    else if (method === 'rounded' || method === 'rounded-values') {
        const step = (max - min) / classCount;
        const breaks = [min];

        for (let i = 1; i < classCount; i++) {
            const rawValue = min + (i * step);
            const roundedValue = roundToNiceNumber(rawValue);
            breaks.push(roundedValue);
        }

        breaks.push(max);

        // Remove duplicates and ensure ascending order
        const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b);

        // If we lost breaks due to rounding, fill in the gaps
        if (uniqueBreaks.length < classCount + 1) {
            return calculateBreaks(values, 'equal', classCount);
        }

        return uniqueBreaks;
    }

    // Logarithmic Interval (Logaritmik Aralık)
    else if (method === 'logarithmic') {
        // Logaritmik ölçekte eşit aralıklar
        // Min değer 0 olamaz, en az 1 olmalı
        const logMin = Math.max(1, min);

        if (logMin === 0 || max === 0) {
            safeWarnClass('⚠️ Logaritmik sınıflandırma için değerler 0 olamaz. Quantile kullanılıyor.');
            return calculateBreaks(values, 'quantile', classCount);
        }

        const logMinValue = Math.log10(logMin);
        const logMaxValue = Math.log10(max);
        const logStep = (logMaxValue - logMinValue) / classCount;

        const breaks = [];
        for (let i = 0; i <= classCount; i++) {
            breaks.push(Math.pow(10, logMinValue + (i * logStep)));
        }

        return breaks;
    }

    // Custom (Özel Kırılma Değerleri)
    else if (method === 'custom' && customBreaks && customBreaks.length > 0) {
        return customBreaks;
    }

    // Fallback: return min-max
    return [min, max];
}

/**
 * Suggest the best classification method based on data distribution
 * @param {Array<number>} values - Array of data values
 * @returns {string} - Suggested method name
 */
function suggestClassificationMethod(values) {
    if (!values || values.length === 0) return 'quantile';

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;

    // Check for skewness
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    const skewness = (mean - median) / range;

    // If highly skewed, suggest jenks or logarithmic
    if (Math.abs(skewness) > 0.3) {
        // If all values are positive, logarithmic might work well
        if (min > 0) {
            const logRange = Math.log10(max / min);
            if (logRange > 2) {
                return 'logarithmic';
            }
        }
        return 'jenks';
    }

    // Default to quantile for balanced distributions
    return 'quantile';
}

// Legacy: Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.ClassificationMethods = {
        calculateBreaks,
        calculateJenksBreaks,
        roundToNiceNumber,
        suggestClassificationMethod
    };

    // Export individual items for tests
    window.calculateBreaks = calculateBreaks;
    window.calculateJenksBreaks = calculateJenksBreaks;
}
