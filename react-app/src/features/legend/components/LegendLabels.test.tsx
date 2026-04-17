import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { LabelDescriptor, LabelLayoutMode } from '../types'
import LegendLabels from './LegendLabels'

const mockUseLabelCollision = vi.fn()

vi.mock('../hooks/useLabelCollision', () => ({
  useLabelCollision: (...args: unknown[]) => mockUseLabelCollision(...args),
}))

function makeLabel(label: Partial<LabelDescriptor>): LabelDescriptor {
  return {
    value: 0,
    text: '',
    x: 0,
    estimatedWidth: 10,
    visible: true,
    ...label,
  }
}

function makeCollisionResult(labels: LabelDescriptor[], layoutMode: LabelLayoutMode) {
  return { labels, layoutMode }
}

describe('LegendLabels', () => {
  beforeEach(() => {
    mockUseLabelCollision.mockReset()
  })

  it('shows all boundary labels (N+1 for N colors) and preserves abbreviated formatting', () => {
    mockUseLabelCollision.mockReturnValue(
      makeCollisionResult(
        [
          makeLabel({ value: 1_100_000, text: '1M', x: 0, visible: true }),
          makeLabel({ value: 1_300_000, text: '1M', x: 40, visible: true }),
          makeLabel({ value: 1_500_000, text: '2M', x: 80, visible: true }),
          makeLabel({ value: 1_700_000, text: '2M', x: 120, visible: true }),
          makeLabel({ value: 1_900_000, text: '2M', x: 160, visible: true }),
          makeLabel({ value: 2_100_000, text: '2M', x: 200, visible: true }),
          makeLabel({ value: 2_300_000, text: '2M', x: 240, visible: true }),
          makeLabel({ value: 2_500_000, text: '3M', x: 280, visible: true }),
        ],
        'inline',
      ),
    )

    const { container } = render(
      <LegendLabels
        breaks={[1_100_000, 1_300_000, 1_500_000, 1_700_000, 1_900_000, 2_100_000, 2_300_000, 2_500_000]}
        colors={['#111', '#222', '#333', '#444', '#555', '#666', '#777']}
        width={280}
        formatLabel={(value) => `${Math.round(value / 1_000_000)}M`}
        mode="steps"
        classificationMethod="jenks"
        labelType="ruler"
      />,
    )

    expect(container.querySelectorAll('.smart-label').length).toBe(8)
    expect(container.textContent).not.toContain('+')

    const renderedTitles = Array.from(container.querySelectorAll('.smart-label'))
      .map((label) => label.getAttribute('title') ?? '')
    expect(renderedTitles.every((title) => title.endsWith('M'))).toBe(true)
  })
})
