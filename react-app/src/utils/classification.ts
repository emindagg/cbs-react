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

  if (method === 'kmeans') {
    return extractBreaksFromCkmeans(sorted, classCount)
  }

  return [sorted[0], sorted[sorted.length - 1]]
}
