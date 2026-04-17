/**
 * Classification Methods
 * Break-point algorithms for choropleth maps
 * Uses simple-statistics ckmeans, equalIntervalBreaks, quantileSorted
 */

import * as ss from 'simple-statistics'

import type { ClassificationMethod } from '../types/visualization'

/**
 * Extract break boundaries from ckmeans clustering result
 */
function extractBreaksFromCkmeans(sorted: number[], classCount: number): number[] {
  const uniqueCount = new Set(sorted).size
  const effectiveClasses = Math.min(classCount, uniqueCount)
  if (effectiveClasses <= 1) return [sorted[0], sorted[sorted.length - 1]]

  const clusters = ss.ckmeans(sorted, effectiveClasses)
  const breaks = [clusters[0][0]]
  for (const cluster of clusters) {
    breaks.push(cluster[cluster.length - 1])
  }
  return [...new Set(breaks)]
}

/**
 * Calculate classification breaks using different methods
 */
export function calculateBreaks(
  values: number[],
  method: ClassificationMethod,
  classCount: number,
): number[] {
  const sorted = [...values].sort((a, b) => a - b)

  // Map continuous methods to their stepped equivalents
  if (method === 'continuous-linear') {
    method = 'equal'
  } else if (method === 'continuous-quantile') {
    method = 'quantile'
  } else if (method === 'continuous-natural') {
    method = 'jenks'
  }

  if (method === 'equal') {
    return ss.equalIntervalBreaks(sorted, classCount)
  }

  if (method === 'quantile') {
    const breaks = [sorted[0]]
    for (let i = 1; i < classCount; i++) {
      breaks.push(ss.quantileSorted(sorted, i / classCount))
    }
    breaks.push(sorted[sorted.length - 1])
    return breaks
  }

  if (method === 'jenks') {
    return extractBreaksFromCkmeans(sorted, classCount)
  }

  if (method === 'stddev') {
    const mean = ss.mean(sorted)
    const stdDev = ss.standardDeviation(sorted)

    if (stdDev === 0) return [sorted[0], sorted[sorted.length - 1]]

    const breaksSet = new Set<number>()
    const minVal = sorted[0]
    const maxVal = sorted[sorted.length - 1]

    // classCount için gerekli iç break sayısı; tek ise mean de bir break olur (asimetriyi giderir).
    // Çift iç break → k={0.5, 1.5, ...}; tek iç break → mean + k={1.0, 2.0, ...}
    const interiorBreaks = Math.max(0, classCount - 1)
    const pairs = Math.floor(interiorBreaks / 2)
    const needsMean = interiorBreaks % 2 === 1
    const kStart = needsMean ? 1.0 : 0.5

    if (needsMean && mean > minVal && mean < maxVal) {
      breaksSet.add(mean)
    }
    for (let p = 0; p < pairs; p++) {
      const k = kStart + p
      const b1 = mean + k * stdDev
      const b2 = mean - k * stdDev

      if (b1 < maxVal) {
        breaksSet.add(b1)
      }
      if (b2 > minVal) {
        breaksSet.add(b2)
      }
    }

    const sortedBreaks = Array.from(breaksSet).sort((a, b) => a - b)

    // Filter out breaks that result in empty classes
    const validBreaks = [minVal]
    for (const b of sortedBreaks) {
      const lastBreak = validBreaks[validBreaks.length - 1]
      // Check if there is data between the last break and the current break
      const hasData = sorted.some((val) => val > lastBreak && val <= b)
      if (hasData) {
        validBreaks.push(b)
      }
    }

    // Ensure the maximum value is covered by the final class
    const lastValid = validBreaks[validBreaks.length - 1]
    if (lastValid < maxVal) {
      const hasDataAfter = sorted.some((val) => val > lastValid)
      if (hasDataAfter) {
        validBreaks.push(maxVal)
      } else {
        // If no data > lastValid but lastValid < maxVal, just set last break to maxVal
        validBreaks[validBreaks.length - 1] = maxVal
      }
    }

    return validBreaks
  }

  return [sorted[0], sorted[sorted.length - 1]]
}
