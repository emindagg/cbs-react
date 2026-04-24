/**
 * LegendBar
 *
 * Renders either:
 *   • Steps mode   → N equally-sized color blocks side-by-side
 *   • Continuous   → Single element with a CSS linear-gradient
 *
 * Always horizontal — never wraps.
 */

import { useMemo } from 'react'

import type { LegendBarProps } from '../types'

/**
 * Build a CSS linear-gradient string from colors and breaks.
 */
function buildGradient(colors: string[], breaks: number[]): string {
  if (colors.length === 0) return 'transparent'
  if (colors.length === 1) return colors[0]

  // For continuous mode with many interpolated colors (e.g. 30),
  // distribute them evenly across the bar
  if (breaks.length <= 2) {
    const stops = colors.map((c, i) => {
      const pct = (i / (colors.length - 1)) * 100
      return `${c} ${pct.toFixed(1)}%`
    })
    return `linear-gradient(to right, ${stops.join(', ')})`
  }

  // When breaks are provided for each color, use real positions
  const min = breaks[0]
  const max = breaks[breaks.length - 1]
  const range = max - min
  if (range === 0) return colors[0]

  const stops = colors.map((color, i) => {
    const breakVal = breaks[Math.min(i, breaks.length - 1)]
    const pct = ((breakVal - min) / range) * 100
    return `${color} ${pct.toFixed(1)}%`
  })

  const lastColor = colors[colors.length - 1]
  if (!stops[stops.length - 1]?.endsWith('100.0%')) {
    stops.push(`${lastColor} 100%`)
  }

  return `linear-gradient(to right, ${stops.join(', ')})`
}

export default function LegendBar({
  mode,
  colors,
  breaks,
  width,
  barHeight = 14,
  fillOpacity = 1,
}: LegendBarProps) {
  const gradient = useMemo(() => buildGradient(colors, breaks), [colors, breaks])

  if (mode === 'continuous') {
    return (
      <div
        className="legend-bar legend-bar--continuous"
        style={{
          width: `${width}px`,
          height: `${barHeight}px`,
          background: gradient,
          opacity: fillOpacity,
        }}
      />
    )
  }

  // Steps mode — equal-width blocks, never wrap
  const stepWidth = width / colors.length

  return (
    <div
      className="legend-bar"
      style={{ width: `${width}px`, height: `${barHeight}px`, opacity: fillOpacity }}
    >
      {colors.map((color, i) => (
        <div
          key={i}
          className="legend-bar__step"
          style={{
            width: `${stepWidth}px`,
            height: '100%',
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  )
}
