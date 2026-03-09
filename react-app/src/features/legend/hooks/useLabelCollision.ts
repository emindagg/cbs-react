/**
 * useLabelCollision Hook
 *
 * Measures formatted label widths and determines the optimal layout mode:
 *   - inline    → all labels fit side-by-side horizontally
 *   - vertical  → labels rotate ~55° downward
 *   - thinned   → only a subset of labels is shown (extreme case)
 */

import { useMemo } from 'react'

import type { LabelDescriptor, LabelLayoutMode } from '../types'

/** Average character width in px for a sans-serif font at ~11px */
const CHAR_WIDTH_PX = 6.5
/** Minimum gap between two adjacent labels (px) */
const MIN_GAP_PX = 4
/**
 * In vertical mode each label occupies ~fontSize horizontally
 * (because the text is rotated). We need at least this much gap.
 */
const VERTICAL_SLOT_PX = 14

/**
 * Estimate the rendered width of a text string.
 */
function estimateTextWidth(text: string): number {
  return text.length * CHAR_WIDTH_PX
}

/**
 * Given the breaks, total width and a formatter, compute label descriptors
 * and decide which layout mode to use.
 */
export function useLabelCollision(
  breaks: number[],
  totalWidth: number,
  formatLabel: (v: number) => string,
  colorsLength: number,
): { labels: LabelDescriptor[]; layoutMode: LabelLayoutMode } {
  return useMemo(() => {
    if (breaks.length === 0) {
      return { labels: [], layoutMode: 'inline' as LabelLayoutMode }
    }

    const stepWidth = totalWidth / colorsLength

    // Build initial label descriptors
    const labels: LabelDescriptor[] = breaks.map((value, i) => {
      const text = formatLabel(value)
      return {
        value,
        text,
        x: stepWidth * i,
        estimatedWidth: estimateTextWidth(text),
        visible: true,
      }
    })

    // --- Pass 1: Check if inline (horizontal) layout works ---
    let hasCollision = false
    for (let i = 0; i < labels.length - 1; i++) {
      const gap =
        labels[i + 1].x -
        labels[i].x -
        labels[i].estimatedWidth / 2 -
        labels[i + 1].estimatedWidth / 2
      if (gap < MIN_GAP_PX) {
        hasCollision = true
        break
      }
    }

    if (!hasCollision) {
      return { labels, layoutMode: 'inline' as LabelLayoutMode }
    }

    // --- Pass 2: Vertical (rotated) mode ---
    // When rotated ~55°, labels stack vertically so they only need
    // ~fontSize of horizontal space per label. Check if that fits.
    let verticalOk = true
    for (let i = 0; i < labels.length - 1; i++) {
      const gap = labels[i + 1].x - labels[i].x
      if (gap < VERTICAL_SLOT_PX) {
        verticalOk = false
        break
      }
    }

    if (verticalOk) {
      return { labels, layoutMode: 'vertical' as LabelLayoutMode }
    }

    // --- Pass 3: Thin labels – keep first, last and evenly spaced ---
    // Use vertical mode for the visible subset
    const maxVisible = Math.max(2, Math.floor(totalWidth / (VERTICAL_SLOT_PX + 2)))
    const thinnedLabels = labels.map((l) => ({ ...l, visible: false }))

    if (thinnedLabels.length > 0) {
      thinnedLabels[0].visible = true
      thinnedLabels[thinnedLabels.length - 1].visible = true

      const remaining = maxVisible - 2
      if (remaining > 0 && thinnedLabels.length > 2) {
        const step = (thinnedLabels.length - 1) / (remaining + 1)
        for (let n = 1; n <= remaining; n++) {
          const idx = Math.round(step * n)
          if (idx > 0 && idx < thinnedLabels.length - 1) {
            thinnedLabels[idx].visible = true
          }
        }
      }
    }

    return { labels: thinnedLabels, layoutMode: 'thinned' as LabelLayoutMode }
  }, [breaks, totalWidth, formatLabel, colorsLength])
}
