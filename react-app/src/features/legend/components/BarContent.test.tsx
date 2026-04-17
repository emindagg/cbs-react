import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { LegendConfiguration } from '@/types/visualization'

import { BarContent } from './BarContent'

const baseConfig: LegendConfiguration = {
  visible: true,
  position: 'above',
  size: 180,
  orientation: 'vertical',
  labels: { type: 'ruler' },
  format: '0a',
  title: { show: true, text: 'Lejant', fontSize: 16 },
  highlightOnHover: false,
  reverseOrder: false,
}

describe('BarContent', () => {
  it('shows all boundary labels (N+1 for N colors) and preserves abbreviations for jenks-like breaks', () => {
    const { container } = render(
      <BarContent
        config={baseConfig}
        breaks={[1_100_000, 1_300_000, 1_500_000, 1_700_000, 1_900_000, 2_100_000, 2_300_000, 2_500_000]}
        colors={['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f']}
        scaleType="steps"
        classificationMethod="jenks"
        onItemHover={() => {}}
        hoveredIndex={null}
      />,
    )

    const labels = Array.from(container.querySelectorAll('span'))
      .map((node) => node.textContent ?? '')
      .filter((text) => text.trim().length > 0)

    expect(labels.length).toBe(8)
    expect(labels.join(' ')).not.toContain('+')
    expect(labels.every((label) => label.endsWith('M'))).toBe(true)
  })
})
