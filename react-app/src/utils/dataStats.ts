/**
 * Data Statistics
 * Distribution analysis and classification method suggestion
 * Uses simple-statistics for all computations
 */

import * as ss from 'simple-statistics'

import type { ClassificationMethod } from '../types/visualization'

/**
 * Calculate detailed statistics for data distribution
 */
export function calculateDataStats(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number;
  range: number;
  skewness: number;
  hasOutliers: boolean;
} {
  if (!values || values.length === 0) {
    return {
      min: 0, max: 0, mean: 0, median: 0,
      stdDev: 0, cv: 0, range: 0, skewness: 0, hasOutliers: false,
    }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const min = ss.min(sorted)
  const max = ss.max(sorted)
  const range = max - min
  const mean = ss.mean(values)
  const median = ss.medianSorted(sorted)
  const stdDev = ss.standardDeviation(values)
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0

  // Fisher's skewness (requires n >= 3)
  const skewness = values.length >= 3 ? ss.sampleSkewness(values) : 0

  // Outlier detection using IQR method
  const q1 = ss.quantileSorted(sorted, 0.25)
  const q3 = ss.quantileSorted(sorted, 0.75)
  const iqr = ss.interquartileRange(sorted)
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  const hasOutliers = sorted[0] < lowerBound || sorted[sorted.length - 1] > upperBound

  return { min, max, mean, median, stdDev, cv, range, skewness, hasOutliers }
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

  if (stats.cv > 150) {
    return {
      method: 'jenks',
      reason: 'Doğal Kırılma (Jenks)',
      emoji: '🎯',
      warning: `Veriler aşırı heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler mevcut. ' : ''}Jenks metodu doğal grupları bulur.`,
    }
  }

  if (stats.cv > 50 || stats.hasOutliers) {
    return {
      method: 'jenks',
      reason: 'Doğal Kırılma (Jenks)',
      emoji: '🎯',
      warning: `Veriler heterojen yapıda (CV: ${stats.cv.toFixed(1)}%). ${stats.hasOutliers ? 'Uç değerler var. ' : ''}Jenks metodu doğal grupları bulur.`,
    }
  }

  if (Math.abs(stats.skewness) > 0.5) {
    return {
      method: 'quantile',
      reason: 'Yüzdelik (Quantile)',
      emoji: '📊',
      warning: `Veriler orta derecede çarpık (CV: ${stats.cv.toFixed(1)}%). Quantile her sınıfta eşit sayıda öğe garantiler.`,
    }
  }

  return {
    method: 'quantile',
    reason: 'Yüzdelik (Quantile)',
    emoji: '📊',
    warning: `Veriler dengeli dağılımlı (CV: ${stats.cv.toFixed(1)}%). Quantile yöntemi önerilir.`,
  }
}
