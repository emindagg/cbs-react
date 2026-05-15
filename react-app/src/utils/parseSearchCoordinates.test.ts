import { describe, expect, it } from 'vitest'

import {
  isValidCoordinateRange,
  parseSearchCoordinates,
  resolveDecimalOrder,
} from './parseSearchCoordinates'

describe('parseSearchCoordinates', () => {
  it('ondalık lat,lng çiftini parse eder', () => {
    const result = parseSearchCoordinates('39.54116657418293, 45.80178391575049')
    expect(result).toEqual({
      lat: 39.54116657418293,
      lng: 45.80178391575049,
    })
  })

  it('boşluklu ondalık çiftini parse eder', () => {
    const result = parseSearchCoordinates('39.54 45.80')
    expect(result).toEqual({ lat: 39.54, lng: 45.8 })
  })

  it('lng,lat sırasını Türkiye aralığında çevirir', () => {
    const result = parseSearchCoordinates('45.80, 39.54')
    expect(result).toEqual({ lat: 39.54, lng: 45.8 })
  })

  it('boşluklu lng,lat sırasını çevirir', () => {
    const result = parseSearchCoordinates('45.80 39.54')
    expect(result).toEqual({ lat: 39.54, lng: 45.8 })
  })

  it('|ilk|>90 ise lng,lat kabul eder', () => {
    expect(resolveDecimalOrder(120.5, 35.2)).toEqual({ lat: 35.2, lng: 120.5 })
  })

  it('DMS formatını ondalığa çevirir', () => {
    const result = parseSearchCoordinates('39°32\'20.7"N 45°47\'02.3"E')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(39.539083333, 5)
    expect(result!.lng).toBeCloseTo(45.783972222, 5)
  })

  it('virgülle ayrılmış DMS çiftini parse eder', () => {
    const result = parseSearchCoordinates('39°32\'20.7"N, 45°47\'02.3"E')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(39.539083333, 5)
    expect(result!.lng).toBeCloseTo(45.783972222, 5)
  })

  it('sembolsüz DMS parse eder', () => {
    const result = parseSearchCoordinates('39 32 20.7 N 45 47 02.3 E')
    expect(result).not.toBeNull()
    expect(result!.lat).toBeCloseTo(39.539083333, 5)
    expect(result!.lng).toBeCloseTo(45.783972222, 5)
  })

  it('yer adı metnini koordinat saymaz', () => {
    expect(parseSearchCoordinates('Ankara Kızılay')).toBeNull()
  })

  it('geçerli enlem/boylam aralığını doğrular', () => {
    expect(isValidCoordinateRange(39.5, 45.8)).toBe(true)
    expect(isValidCoordinateRange(91, 0)).toBe(false)
    expect(isValidCoordinateRange(0, 181)).toBe(false)
  })
})
