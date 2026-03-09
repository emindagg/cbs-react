/**
 * LegendLabels
 *
 * Renders boundary-aligned labels below the color bar.
 * Supports three label types:
 *   • ruler   → one value per boundary
 *   • ranges  → "min – max" per color segment
   *   • custom  → user-defined labels per segment
 *
 * Uses useLabelCollision to auto-switch inline → staggered → thinned.
 */

import type { LegendLabelsProps } from '../types'
import SmartLabel from './SmartLabel'
import { useLabelCollision } from '../hooks/useLabelCollision'
import { disambiguateBoundaryLabels } from '../utils/disambiguateBoundaryLabels'

const BAR_HEIGHT = 14

export default function LegendLabels({
  breaks,
  colors,
  width,
  formatLabel,
  mode,
  classificationMethod,
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
    let effectiveLabels = isMinMax
      ? boundaryLabels.filter((_, i) => i === 0 || i === boundaryLabels.length - 1)
      : boundaryLabels

    const displayValues = reverseOrder
      ? [...effectiveLabels.map((label) => label.value)].reverse()
      : effectiveLabels.map((label) => label.value)
    const disambiguatedTexts = disambiguateBoundaryLabels(
      displayValues,
      formatLabel,
      { classificationMethod },
    )

    effectiveLabels = effectiveLabels.map((label, i) => ({
      ...label,
      text: disambiguatedTexts[i] ?? label.text,
    }))

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

  // ── Ranges / Custom mode: swatch list ─────
  const segmentItems = colors.map((color, i) => {
    if (labelType === 'custom' && customLabels?.[i]) {
      return { color, text: customLabels[i] }
    }
    // ranges: "lower – upper"
    const lower = breaks[i]
    const upper = breaks[i + 1]
    if (lower !== undefined && upper !== undefined) {
      return { color, text: `${formatLabel(lower)} – ${formatLabel(upper)}` }
    }
    return { color, text: '' }
  })

  const ordered = reverseOrder ? [...segmentItems].reverse() : segmentItems

  return (
    <div className="legend-items legend-items--ranges" style={{ width: `${width}px` }}>
      {ordered.map((item, i) => (
        <div key={i} className="legend-item" title={item.text}>
          <span className="legend-item__swatch" style={{ backgroundColor: item.color }} />
          <span className="legend-item__label">{item.text}</span>
        </div>
      ))}
    </div>
  )
}
