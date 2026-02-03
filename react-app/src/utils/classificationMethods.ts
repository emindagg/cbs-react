/**
 * Classification Methods
 * Statistical classification algorithms for choropleth maps
 */

import type { ClassificationMethod } from '../types/visualization'

/**
 * Calculate variance for a subset of values
 */
function calculateVariance(values: number[], start: number, end: number): number {
  if (start >= end) return 0

  const subset = values.slice(start, end + 1)
  const n = subset.length

  if (n === 0) return 0
  if (n === 1) return 0

  const mean = subset.reduce((sum, val) => sum + val, 0) / n
  const variance = subset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0)

  return variance
}

/**
 * Round a number to a "nice" value (inspired by Datawrapper)
 * Returns nicely rounded numbers like 10, 20, 25, 50, 100, 200, 250, 500, etc.
 */
function roundToNiceNumber(value: number): number {
  if (value === 0) return 0

  const isNegative = value < 0
  const absValue = Math.abs(value)

  // Find the order of magnitude
  const magnitude = Math.pow(10, Math.floor(Math.log10(absValue)))

  // Normalize to 1-10 range
  const normalized = absValue / magnitude

  // Round to nice numbers in the 1-10 range
  let rounded: number
  if (normalized <= 1) rounded = 1
  else if (normalized <= 2) rounded = 2
  else if (normalized <= 2.5) rounded = 2.5
  else if (normalized <= 5) rounded = 5
  else rounded = 10

  // Scale back to original magnitude
  const result = rounded * magnitude

  return isNegative ? -result : result
}

/**
 * Jenks Natural Breaks (Fisher-Jenks) Algorithm
 * Minimizes variance within classes and maximizes variance between classes
 */
function calculateJenksBreaks(sortedValues: number[], numClasses: number): number[] {
  const n = sortedValues.length

  // Boundary case: if we have fewer unique values than classes
  const uniqueValues = [...new Set(sortedValues)].sort((a, b) => a - b)
  if (uniqueValues.length <= numClasses) {
    console.warn(
      `Jenks: ${uniqueValues.length} unique values, ${numClasses} classes requested. Using quantile.`,
    )
    return calculateBreaks(sortedValues, 'quantile', numClasses)
  }

  // Boundary case: if we have fewer values than classes
  if (n <= numClasses) {
    return sortedValues
  }

  // Initialize matrices
  const lowerClassLimits: number[][] = []
  const variance: number[][] = []

  // Initialize arrays
  for (let i = 0; i <= n; i++) {
    lowerClassLimits[i] = []
    variance[i] = []
    for (let j = 0; j <= numClasses; j++) {
      lowerClassLimits[i][j] = 0
      variance[i][j] = 0
    }
  }

  // Initialize for 1 class
  for (let i = 1; i <= n; i++) {
    variance[i][1] = calculateVariance(sortedValues, 0, i - 1)
    lowerClassLimits[i][1] = 0
  }

  // Fill matrices using dynamic programming
  for (let numClass = 2; numClass <= numClasses; numClass++) {
    for (let i = numClass; i <= n; i++) {
      variance[i][numClass] = Infinity

      // Try all possible positions for the lower class limit
      for (let k = numClass - 1; k < i; k++) {
        // Calculate variance for this split
        const v1 = variance[k][numClass - 1]
        const v2 = calculateVariance(sortedValues, k, i - 1)
        const totalVariance = v1 + v2

        // Keep the split with minimum variance
        if (totalVariance < variance[i][numClass]) {
          variance[i][numClass] = totalVariance
          lowerClassLimits[i][numClass] = k
        }
      }
    }
  }

  // Extract breaks from the matrices
  const breaks: number[] = []
  let k = n

  // Build breaks array from end to start
  for (let numClass = numClasses; numClass >= 2; numClass--) {
    const idx = lowerClassLimits[k][numClass]
    if (idx > 0 && idx < n) {
      breaks.push(sortedValues[idx])
    }
    k = idx
  }

  // Add min and max values
  breaks.reverse()
  breaks.unshift(sortedValues[0])
  breaks.push(sortedValues[n - 1])

  // Remove any duplicates and ensure sorted
  let uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b)

  // Ensure we have exactly numClasses + 1 breaks
  if (uniqueBreaks.length < numClasses + 1) {
    console.warn(
      `Jenks: ${uniqueBreaks.length} breaks found, ${numClasses + 1} needed. Using quantile.`,
    )
    return calculateBreaks(sortedValues, 'quantile', numClasses)
  }

  // If we have more than needed, trim to exact count
  if (uniqueBreaks.length > numClasses + 1) {
    uniqueBreaks = uniqueBreaks.slice(0, numClasses + 1)
  }

  return uniqueBreaks
}

/**
 * Calculate classification breaks using different methods
 */
export function calculateBreaks(
  values: number[],
  method: ClassificationMethod,
  classCount: number,
  customBreaks: number[] | null = null,
): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  // Equal Interval
  if (method === 'equal') {
    const step = (max - min) / classCount
    return Array.from({ length: classCount + 1 }, (_, i) => min + i * step)
  }

  // Quantile
  if (method === 'quantile') {
    const breaks = [min]
    for (let i = 1; i < classCount; i++) {
      const percentile = i / classCount
      const index = percentile * (sorted.length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)
      const weight = index - lower

      // Linear interpolation for exact percentiles
      if (lower === upper) {
        breaks.push(sorted[lower])
      } else {
        breaks.push(sorted[lower] * (1 - weight) + sorted[upper] * weight)
      }
    }
    breaks.push(max)
    return breaks
  }

  // Jenks Natural Breaks
  if (method === 'jenks') {
    return calculateJenksBreaks(sorted, classCount)
  }

  // Rounded Values
  if (method === 'rounded') {
    const step = (max - min) / classCount
    const breaks = [min]

    for (let i = 1; i < classCount; i++) {
      const rawValue = min + i * step
      const roundedValue = roundToNiceNumber(rawValue)
      breaks.push(roundedValue)
    }

    breaks.push(max)

    // Remove duplicates and ensure ascending order
    const uniqueBreaks = [...new Set(breaks)].sort((a, b) => a - b)

    // If we lost breaks due to rounding, use equal instead
    if (uniqueBreaks.length < classCount + 1) {
      return calculateBreaks(values, 'equal', classCount)
    }

    return uniqueBreaks
  }

  // Logarithmic Interval
  if (method === 'logarithmic') {
    // Min value cannot be 0, at least 1
    const logMin = Math.max(1, min)

    if (logMin === 0 || max === 0) {
      console.warn('Logarithmic classification requires non-zero values. Using quantile.')
      return calculateBreaks(values, 'quantile', classCount)
    }

    const logMinValue = Math.log10(logMin)
    const logMaxValue = Math.log10(max)
    const logStep = (logMaxValue - logMinValue) / classCount

    const breaks = []
    for (let i = 0; i <= classCount; i++) {
      breaks.push(Math.pow(10, logMinValue + i * logStep))
    }

    return breaks
  }

  // Custom
  if (method === 'custom' && customBreaks && customBreaks.length > 0) {
    return customBreaks
  }

  // Fallback: return min-max
  return [min, max]
}

/**
 * Calculate detailed statistics for data distribution
 */
export function calculateDataStats(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number; // Coefficient of Variation
  range: number;
  logRange: number;
  skewness: number;
  hasOutliers: boolean;
} {
  if (!values || values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      cv: 0,
      range: 0,
      logRange: 0,
      skewness: 0,
      hasOutliers: false,
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const min = sorted[0]
  const max = sorted[n - 1]
  const range = max - min

  // Mean
  const mean = values.reduce((sum, v) => sum + v, 0) / n

  // Median
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]

  // Standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  // Coefficient of Variation (CV)
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0

  // Log range (for logarithmic method suitability)
  const logRange = min > 0 ? Math.log10(max / min) : 0

  // Skewness (simplified)
  const skewness = (mean - median) / (range || 1)

  // Outlier detection using IQR method
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const q1 = sorted[q1Index]
  const q3 = sorted[q3Index]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  const hasOutliers = sorted.some((v) => v < lowerBound || v > upperBound)

  return {
    min,
    max,
    mean,
    median,
    stdDev,
    cv,
    range,
    logRange,
    skewness,
    hasOutliers,
  }
}

/**
 * Suggest the best classification method based on data distribution
 */
export function suggestClassificationMethod(values: number[]): {
  method: ClassificationMethod;
  reason: string;
  emoji: string;
  warning?: string;
} {
  if (!values || values.length === 0) {
    return { method: 'quantile', reason: 'Varsayılan yöntem', emoji: '📊' }
  }

  const stats = calculateDataStats(values)

  // Very high CV (>150%) - extremely heterogeneous data
  if (stats.cv > 150) {
    if (stats.min > 0 && stats.logRange > 2) {
      return {
        method: 'logarithmic',
        reason: 'Logaritmik (Logarithmic)',
        emoji: '📈',
        warning: `Veriler aşırı heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler mevcut. ' : ''}Logaritmik ölçeklendirme en uygun yöntemdir.`,
      }
    }
    return {
      method: 'jenks',
      reason: 'Doğal Kırılma (Jenks)',
      emoji: '🎯',
      warning: `Veriler aşırı heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler mevcut. ' : ''}Jenks metodu doğal grupları bulur.`,
    }
  }

  // High CV (>50%) or outliers - heterogeneous data
  if (stats.cv > 50 || stats.hasOutliers) {
    if (stats.min > 0 && stats.logRange > 2) {
      return {
        method: 'logarithmic',
        reason: 'Logaritmik (Logarithmic)',
        emoji: '📈',
        warning: `Veriler heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler var. ' : ''}Logaritmik ölçeklendirme önerilir.`,
      }
    }
    return {
      method: 'jenks',
      reason: 'Doğal Kırılma (Jenks)',
      emoji: '🎯',
      warning: `Veriler heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler var. ' : ''}Jenks metodu doğal grupları bulur.`,
    }
  }

  // Moderate skewness - use quantile
  if (Math.abs(stats.skewness) > 0.2) {
    return {
      method: 'quantile',
      reason: 'Yüzdelik (Quantile)',
      emoji: '📊',
      warning: `Veriler orta derecede çarpık (CV: ${stats.cv.toFixed(1)}%). Quantile her sınıfta eşit sayıda öğe garantiler.`,
    }
  }

  // Balanced distribution - quantile or equal
  return {
    method: 'quantile',
    reason: 'Yüzdelik (Quantile)',
    emoji: '📊',
    warning: `Veriler dengeli dağılımlı (CV: ${stats.cv.toFixed(1)}%). Quantile yöntemi önerilir.`,
  }
}
