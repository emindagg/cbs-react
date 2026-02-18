import { describe, expect, it } from 'vitest'

import { collapseConsecutiveLabels } from './collapseConsecutiveLabels'

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
})
