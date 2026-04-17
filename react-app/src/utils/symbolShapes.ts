/**
 * Symbol Shape Generator
 * Generates SVG paths for different symbol shapes
 */

import type { SymbolShape } from '../types/visualization'

/**
 * Generate SVG path for a circle
 */
function generateCirclePath(centerX: number, centerY: number, radius: number): string {
  return `M ${centerX - radius}, ${centerY}
          a ${radius},${radius} 0 1,0 ${radius * 2},0
          a ${radius},${radius} 0 1,0 ${-radius * 2},0`
}

/**
 * Generate SVG path for a square
 */
function generateSquarePath(centerX: number, centerY: number, size: number): string {
  const half = size / 2
  return `M ${centerX - half} ${centerY - half}
          L ${centerX + half} ${centerY - half}
          L ${centerX + half} ${centerY + half}
          L ${centerX - half} ${centerY + half}
          Z`
}

/**
 * Generate SVG path for an equilateral triangle (pointing up)
 */
function generateTrianglePath(centerX: number, centerY: number, size: number): string {
  const height = (size * Math.sqrt(3)) / 2
  const top = centerY - (height * 2) / 3
  const bottom = centerY + height / 3
  const left = centerX - size / 2
  const right = centerX + size / 2

  return `M ${centerX} ${top}
          L ${right} ${bottom}
          L ${left} ${bottom}
          Z`
}

/**
 * Generate SVG path for a 5-pointed star
 */
function generateStarPath(centerX: number, centerY: number, size: number): string {
  const outerRadius = size / 2
  const innerRadius = outerRadius * 0.4
  const points: string[] = []

  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
  }

  return points.join(' ') + ' Z'
}

/**
 * Generate SVG path for a diamond (rotated square)
 */
function generateDiamondPath(centerX: number, centerY: number, size: number): string {
  const half = size / 2
  return `M ${centerX} ${centerY - half}
          L ${centerX + half} ${centerY}
          L ${centerX} ${centerY + half}
          L ${centerX - half} ${centerY}
          Z`
}

/**
 * Generate SVG path for a map pin/marker
 */
function generatePinPath(centerX: number, centerY: number, size: number): string {
  const width = size * 0.6
  const height = size
  const circleRadius = width / 3

  // Pin shape: circle on top with pointed bottom
  return `M ${centerX} ${centerY}
          L ${centerX - width / 4} ${centerY - height / 3}
          A ${circleRadius} ${circleRadius} 0 1 1 ${centerX + width / 4} ${centerY - height / 3}
          Z`
}

/**
 * Generate SVG path for any symbol shape
 */
export function generateSymbolPath(
  shape: SymbolShape,
  centerX: number,
  centerY: number,
  size: number,
): string {
  switch (shape) {
    case 'circle':
      return generateCirclePath(centerX, centerY, size / 2)
    case 'square':
      return generateSquarePath(centerX, centerY, size)
    case 'triangle':
      return generateTrianglePath(centerX, centerY, size)
    case 'star':
      return generateStarPath(centerX, centerY, size)
    case 'diamond':
      return generateDiamondPath(centerX, centerY, size)
    case 'pin':
      return generatePinPath(centerX, centerY, size)
    default:
      return generateCirclePath(centerX, centerY, size / 2)
  }
}

/**
 * Calculate symbol size based on scaling method
 */
export function calculateSymbolSize(
  value: number,
  minValue: number,
  maxValue: number,
  minSize: number,
  maxSize: number,
  scaling: 'linear' | 'sqrt' | 'log' = 'sqrt',
): number {
  if (maxValue === minValue) return (minSize + maxSize) / 2

  let normalizedValue: number

  switch (scaling) {
    case 'linear':
      normalizedValue = (value - minValue) / (maxValue - minValue)
      break

    case 'sqrt':
      normalizedValue = Math.sqrt((value - minValue) / (maxValue - minValue))
      break

    case 'log': {
      // Shift domain into the strictly-positive range so Math.log never
      // receives a non-positive argument (NaN / -Infinity for value <= -1).
      const offset = minValue <= 0 ? -minValue + 1 : 1
      const logMin = Math.log(minValue + offset)
      const logMax = Math.log(maxValue + offset)
      const logValue = Math.log(value + offset)
      const denom = logMax - logMin
      normalizedValue = denom === 0 ? 0.5 : (logValue - logMin) / denom
      break
    }

    default:
      normalizedValue = Math.sqrt((value - minValue) / (maxValue - minValue))
  }

  return minSize + normalizedValue * (maxSize - minSize)
}
