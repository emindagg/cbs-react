import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLabelCollision } from './useLabelCollision'

describe('useLabelCollision', () => {
  const breaks = [7, 8, 9]
  const formatLabel = (value: number) => value.toString()

  it('returns inline layout when labels fit horizontally', () => {
    const { result } = renderHook(() =>
      useLabelCollision(breaks, 240, formatLabel, 2),
    )

    expect(result.current.layoutMode).toBe('inline')
    expect(result.current.labels.every((label) => label.visible)).toBe(true)
  })

  it('returns vertical layout when inline collides but vertical spacing is enough', () => {
    const { result } = renderHook(() =>
      useLabelCollision(breaks, 40, () => '10000', 2),
    )

    expect(result.current.layoutMode).toBe('vertical')
    expect(result.current.labels.every((label) => label.visible)).toBe(true)
  })

  it('returns thinned layout when even vertical spacing collides', () => {
    const { result } = renderHook(() =>
      useLabelCollision(breaks, 20, formatLabel, 2),
    )

    expect(result.current.layoutMode).toBe('thinned')
    expect(result.current.labels[0]?.visible).toBe(true)
    expect(result.current.labels[1]?.visible).toBe(false)
    expect(result.current.labels[2]?.visible).toBe(true)
  })
})
