import { describe, expect, it } from 'vitest'

import {
  collapseConsecutiveLabels,
  collapseConsecutiveLabelsWithVisibility,
} from './collapseConsecutiveLabels'

describe('collapseConsecutiveLabels', () => {
  it('collapses full repeated sequence with plus suffix', () => {
    const result = collapseConsecutiveLabels(['2M', '2M', '2M'])
    expect(result).toEqual([
      { text: '2M+', visible: true },
      { text: '2M', visible: false },
      { text: '2M', visible: false },
    ])
  })

  it('collapses only consecutive duplicates', () => {
    const result = collapseConsecutiveLabels(['1M', '2M', '2M', '3M'])
    expect(result).toEqual([
      { text: '1M', visible: true },
      { text: '2M+', visible: true },
      { text: '2M', visible: false },
      { text: '3M', visible: true },
    ])
  })

  it('does not collapse non-consecutive duplicates', () => {
    const result = collapseConsecutiveLabels(['1M', '2M', '1M'])
    expect(result).toEqual([
      { text: '1M', visible: true },
      { text: '2M', visible: true },
      { text: '1M', visible: true },
    ])
  })

  it('does not append double plus when already suffixed', () => {
    const result = collapseConsecutiveLabels(['2M+', '2M+'])
    expect(result).toEqual([
      { text: '2M+', visible: true },
      { text: '2M+', visible: false },
    ])
  })
})

describe('collapseConsecutiveLabelsWithVisibility', () => {
  it('keeps an already visible anchor in a duplicate run', () => {
    const result = collapseConsecutiveLabelsWithVisibility([
      { text: '7', visible: true },
      { text: '8', visible: false },
      { text: '8', visible: true },
      { text: '9', visible: true },
    ])

    expect(result).toEqual([
      { text: '7', visible: true },
      { text: '8', visible: false },
      { text: '8+', visible: true },
      { text: '9', visible: true },
    ])
  })
})
