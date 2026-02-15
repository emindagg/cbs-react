/**
 * SmartLabel
 *
 * Renders a single boundary label.
 * Supports three layout modes:
 *   - inline   → normal horizontal text, centered under boundary
 *   - vertical → text rotated 90° downward, top edge aligned to boundary tick
 *   - thinned  → same as vertical but some labels hidden
 */

import type { SmartLabelProps } from '../types'

export default function SmartLabel({ label, layoutMode }: SmartLabelProps) {
  if (!label.visible) return null

  const isVertical = layoutMode === 'vertical' || layoutMode === 'thinned'

  if (isVertical) {
    // Vertical mode: outer span positions, inner span rotates for bottom-to-top reading
    return (
      <span
        className="smart-label smart-label--vertical"
        style={{ left: `${label.x}px` }}
        title={label.text}
      >
        <span className="smart-label__inner">{label.text}</span>
      </span>
    )
  }

  // Inline mode: centered horizontally under boundary
  return (
    <span
      className="smart-label"
      style={{ left: `${label.x}px` }}
      title={label.text}
    >
      {label.text}
    </span>
  )
}
