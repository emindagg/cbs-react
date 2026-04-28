import { describe, expect, it } from 'vitest'

import type { AspectDirection, TerrainAspectClass } from '../types'
import { ASPECT_CLASS_DEFINITIONS } from './aspectClasses'
import {
  EAST_WEST_DIRECTIONS,
  NORTH_GROUP_DIRECTIONS,
  SOUTH_GROUP_DIRECTIONS,
  computeDirectionGroups,
} from './aspectGrouping'

function makeClass(direction: AspectDirection, pixelCount: number): TerrainAspectClass {
  const def = ASPECT_CLASS_DEFINITIONS.find((item) => item.direction === direction)
  return {
    direction,
    label: def?.label ?? direction,
    color: def?.color ?? '#000000',
    pixelCount,
    fromDeg: def?.fromDeg ?? -1,
    toDeg: def?.toDeg ?? -1,
  }
}

function makeResult(pixelByDir: Partial<Record<AspectDirection, number>>, areaKm2 = 100) {
  const classes = ASPECT_CLASS_DEFINITIONS.map((def) => makeClass(def.direction, pixelByDir[def.direction] ?? 0))
  return { classes, areaKm2 }
}

describe('aspectGrouping > grup tanımları', () => {
  it('Kuzey grubu yalnız K, KD, KB içerir', () => {
    expect(NORTH_GROUP_DIRECTIONS.sort()).toEqual(['north', 'northeast', 'northwest'].sort())
  })

  it('Doğu-Batı grubu yalnız D ve B içerir', () => {
    expect(EAST_WEST_DIRECTIONS.sort()).toEqual(['east', 'west'].sort())
  })

  it('Güney grubu yalnız G, GD, GB içerir', () => {
    expect(SOUTH_GROUP_DIRECTIONS.sort()).toEqual(['south', 'southeast', 'southwest'].sort())
  })

  it('Düz hiçbir grupta değildir', () => {
    const all = [...NORTH_GROUP_DIRECTIONS, ...EAST_WEST_DIRECTIONS, ...SOUTH_GROUP_DIRECTIONS]
    expect(all).not.toContain('flat')
  })

  it('8 yön gruplarda çakışmasız ve eksiksiz dağılır', () => {
    const all = [...NORTH_GROUP_DIRECTIONS, ...EAST_WEST_DIRECTIONS, ...SOUTH_GROUP_DIRECTIONS]
    const unique = new Set(all)
    expect(unique.size).toBe(8)
    expect(all).toHaveLength(8)
  })
})

describe('computeDirectionGroups > çıktı yapısı', () => {
  it('her zaman 3 grup döner', () => {
    const groups = computeDirectionGroups(makeResult({}))
    expect(groups).toHaveLength(3)
  })

  it('grup sırası: kuzey → doğu-batı → güney', () => {
    const groups = computeDirectionGroups(makeResult({}))
    expect(groups.map((g) => g.key)).toEqual(['north', 'east-west', 'south'])
  })

  it('her grup üye yön sayısı kadar swatchColor üretir', () => {
    const groups = computeDirectionGroups(makeResult({}))
    const [northGroup, eastWestGroup, southGroup] = groups
    expect(northGroup.swatchColors).toHaveLength(3)
    expect(eastWestGroup.swatchColors).toHaveLength(2)
    expect(southGroup.swatchColors).toHaveLength(3)
  })

  it('swatchColors ASPECT_CLASS_DEFINITIONS\'taki renklerle eşleşir', () => {
    const groups = computeDirectionGroups(makeResult({}))
    const colorFor = (d: AspectDirection) => ASPECT_CLASS_DEFINITIONS.find((c) => c.direction === d)?.color
    const [northGroup] = groups
    expect(northGroup.swatchColors).toEqual([colorFor('north'), colorFor('northeast'), colorFor('northwest')])
  })

  it('etiket ve üye metni Türkçe ve doğru', () => {
    const [n, ew, s] = computeDirectionGroups(makeResult({}))
    expect(n.label).toBe('Kuzey grubu')
    expect(n.members).toBe('K · KD · KB')
    expect(ew.label).toBe('Doğu - Batı')
    expect(ew.members).toBe('D · B')
    expect(s.label).toBe('Güney grubu')
    expect(s.members).toBe('G · GD · GB')
  })
})

describe('computeDirectionGroups > yüzde hesabı', () => {
  it('hiç piksel yoksa tüm yüzdeler 0', () => {
    const groups = computeDirectionGroups(makeResult({}))
    expect(groups.every((g) => g.percent === 0)).toBe(true)
    expect(groups.every((g) => g.areaKm2 === 0)).toBe(true)
  })

  it('sadece kuzey pikselleri varsa kuzey grubu %100, diğerleri %0', () => {
    const groups = computeDirectionGroups(makeResult({ north: 50 }))
    const [n, ew, s] = groups
    expect(n.percent).toBe(100)
    expect(ew.percent).toBe(0)
    expect(s.percent).toBe(0)
  })

  it('eşit dağılım: her ana yönde 100 piksel → kuzey ve güney %37,5, doğu-batı %25', () => {
    const groups = computeDirectionGroups(makeResult({
      north: 100, northeast: 100, northwest: 100,
      east: 100, west: 100,
      south: 100, southeast: 100, southwest: 100,
    }))
    const [n, ew, s] = groups
    expect(n.percent).toBeCloseTo(37.5, 5)
    expect(ew.percent).toBeCloseTo(25, 5)
    expect(s.percent).toBeCloseTo(37.5, 5)
    // Düz olmadığı için 3 grup toplamı 100 olmalı
    expect(n.percent + ew.percent + s.percent).toBeCloseTo(100, 5)
  })

  it('düz pikseller paydada sayılır ama hiçbir gruba dahil değil', () => {
    // 10 kuzey + 90 düz → kuzey %10, doğu-batı %0, güney %0
    const groups = computeDirectionGroups(makeResult({ north: 10, flat: 90 }))
    const [n, ew, s] = groups
    expect(n.percent).toBeCloseTo(10, 5)
    expect(ew.percent).toBe(0)
    expect(s.percent).toBe(0)
    // 3 grup toplamı düz alanı kadar 100'den eksik
    expect(n.percent + ew.percent + s.percent).toBeCloseTo(10, 5)
  })

  it('alt yönler doğru gruba toplanır', () => {
    // KD + KB ekle, K boş → kuzey grubu yine bu pikselleri saymalı
    const groups = computeDirectionGroups(makeResult({ northeast: 30, northwest: 70 }))
    const [n, ew, s] = groups
    expect(n.percent).toBe(100)
    expect(ew.percent).toBe(0)
    expect(s.percent).toBe(0)
  })

  it('GD + GB pikselleri Güney grubuna gider, Kuzey veya Doğu-Batı\'ya değil', () => {
    const groups = computeDirectionGroups(makeResult({ southeast: 40, southwest: 60 }))
    const [n, ew, s] = groups
    expect(n.percent).toBe(0)
    expect(ew.percent).toBe(0)
    expect(s.percent).toBe(100)
  })

  it('Doğu ve Batı, Doğu-Batı grubuna gider', () => {
    const groups = computeDirectionGroups(makeResult({ east: 50, west: 50 }))
    const [n, ew, s] = groups
    expect(n.percent).toBe(0)
    expect(ew.percent).toBe(100)
    expect(s.percent).toBe(0)
  })
})

describe('computeDirectionGroups > alan (km²) hesabı', () => {
  it('areaKm2 oranla doğru ölçeklenir', () => {
    // 100 km² alan, 8 yönde 100\'er piksel
    const groups = computeDirectionGroups(makeResult({
      north: 100, northeast: 100, northwest: 100,
      east: 100, west: 100,
      south: 100, southeast: 100, southwest: 100,
    }, 100))
    const [n, ew, s] = groups
    expect(n.areaKm2).toBeCloseTo(37.5, 5)
    expect(ew.areaKm2).toBeCloseTo(25, 5)
    expect(s.areaKm2).toBeCloseTo(37.5, 5)
  })

  it('alan 0 ise hepsi 0', () => {
    const groups = computeDirectionGroups(makeResult({ north: 100 }, 0))
    expect(groups.every((g) => g.areaKm2 === 0)).toBe(true)
  })

  it('düz pikseller alanı azaltır (paydada kalırlar)', () => {
    // 10 kuzey + 90 düz, 100 km² → kuzey grubu 10 km²
    const groups = computeDirectionGroups(makeResult({ north: 10, flat: 90 }, 100))
    const [n] = groups
    expect(n.areaKm2).toBeCloseTo(10, 5)
  })
})
