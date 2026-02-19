import { describe, expect, it } from 'vitest'

import { selectEvenlySpacedItems } from './selectEvenlySpacedItems'

describe('selectEvenlySpacedItems', () => {
  it('preserves first/last while reducing to target count', () => {
    const source = [0, 1, 2, 3, 4, 5, 6, 7]
    const result = selectEvenlySpacedItems(source, 7)

    expect(result).toHaveLength(7)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(7)
  })

  it('returns all items when target count is larger than source', () => {
    const source = [1, 2, 3]
    const result = selectEvenlySpacedItems(source, 7)
    expect(result).toEqual(source)
  })
})

