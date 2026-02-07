/**
 * LegendLabels
 *
 * Renders boundary-aligned labels below the color bar.
 * Supports three label types:
 *   • ruler   → one value per boundary (Datawrapper default)
 *   • ranges  → "min – max" per color segment
 *   • custom  → user-defined labels per segment
 *
 * Uses useLabelCollision to auto-switch inline → staggered → thinned.
 */

import type { LegendLabelsProps } from './legend.types'
import SmartLabel from './SmartLabel'
import { useLabelCollision } from './useLabelCollision'

const BAR_HEIGHT = 14

export default function LegendLabels({
  breaks,
  colors,
  width,
  formatLabel,
  mode,
  labelType,
  customLabels,
  reverseOrder,
}: LegendLabelsProps) {
  // ── Ruler mode: boundary-aligned labels ─────────────────────
  // Works for both steps and continuous
  // Fix: Use breaks to determine logical segments so Min/Max map to 0/Width
  // even if colors array has many gradient stops.
  const logicalSegments = Math.max(1, breaks.length - 1)

  const { labels: boundaryLabels, layoutMode } = useLabelCollision(
    breaks,
    width,
    formatLabel,
    logicalSegments,
  )

  // Continuous with only [min, max] → show only endpoints
  const isMinMax = mode === 'continuous' && breaks.length === 2

  if (labelType === 'ruler' || mode === 'continuous') {
    const effectiveLabels = isMinMax
      ? boundaryLabels.filter((_, i) => i === 0 || i === boundaryLabels.length - 1)
      : reverseOrder
        ? [...boundaryLabels].reverse()
        : boundaryLabels

    const isVertical = layoutMode === 'vertical' || layoutMode === 'thinned'

    const containerClass = [
      'legend-labels',
      isVertical && 'legend-labels--vertical',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={containerClass} style={{ width: `${width}px` }}>
        {/* Labels (SmartLabel handles ticks internally for vertical mode) */}
        {effectiveLabels.map((label, i) => (
          <SmartLabel
            key={i}
            label={label}
            layoutMode={layoutMode}
            barHeight={BAR_HEIGHT}
          />
        ))}
      </div>
    )
  }

  // ── Ranges / Custom mode: one label per color segment ───────
  const stepWidth = width / colors.length

  const segmentLabels = colors.map((_, i) => {
    if (labelType === 'custom' && customLabels?.[i]) {
      return customLabels[i]
    }
    // ranges: "lower – upper"
    const lower = breaks[i]
    const upper = breaks[i + 1]
    if (lower !== undefined && upper !== undefined) {
      return `${formatLabel(lower)} – ${formatLabel(upper)}`
    }
    return ''
  })

  const ordered = reverseOrder ? [...segmentLabels].reverse() : segmentLabels

  return (
    <div className="legend-labels legend-labels--segments" style={{ width: `${width}px` }}>
      {ordered.map((text, i) => (
        <span
          key={i}
          className="legend-labels__segment"
          style={{ width: `${stepWidth}px` }}
          title={text}
        >
          {text}
        </span>
      ))}
    </div>
  )
}
