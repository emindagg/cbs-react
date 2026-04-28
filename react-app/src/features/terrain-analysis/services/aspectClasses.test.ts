import { describe, expect, it } from 'vitest'

import {
  ASPECT_CLASS_DEFINITIONS,
  createInitialAspectClasses,
  getAspectClassColor,
  getAspectClassIndex,
} from './aspectClasses'

describe('aspectClasses', () => {
  it('flat sınıfı her zaman ilk sırada', () => {
    expect(ASPECT_CLASS_DEFINITIONS[0].direction).toBe('flat')
  })

  it('9 sınıf tanımlıdır (flat + 8 yön)', () => {
    expect(ASPECT_CLASS_DEFINITIONS).toHaveLength(9)
  })

  it('createInitialAspectClasses 9 sınıfı sıfır pixelCount ile döner', () => {
    const classes = createInitialAspectClasses()
    expect(classes).toHaveLength(9)
    classes.forEach((cls) => expect(cls.pixelCount).toBe(0))
  })

  it('getAspectClassIndex bilinmeyen yön için 0 (flat) döner', () => {
    expect(getAspectClassIndex('north')).toBeGreaterThan(0)
    expect(getAspectClassIndex('flat')).toBe(0)
  })

  it('her ana yön kendi indeksini bulur', () => {
    expect(ASPECT_CLASS_DEFINITIONS[getAspectClassIndex('north')].direction).toBe('north')
    expect(ASPECT_CLASS_DEFINITIONS[getAspectClassIndex('east')].direction).toBe('east')
    expect(ASPECT_CLASS_DEFINITIONS[getAspectClassIndex('south')].direction).toBe('south')
    expect(ASPECT_CLASS_DEFINITIONS[getAspectClassIndex('west')].direction).toBe('west')
  })

  it('getAspectClassColor 0-255 RGB tuple üretir', () => {
    const [r, g, b] = getAspectClassColor(getAspectClassIndex('north'))
    // Kuzey: #ff0000
    expect(r).toBe(255)
    expect(g).toBe(0)
    expect(b).toBe(0)
  })

  it('Güney rengi #00ff00 yeşil olmalı', () => {
    const [r, g, b] = getAspectClassColor(getAspectClassIndex('south'))
    expect(r).toBe(0)
    expect(g).toBe(255)
    expect(b).toBe(0)
  })

  it('Düz rengi gri (#a9a9a9)', () => {
    const [r, g, b] = getAspectClassColor(getAspectClassIndex('flat'))
    expect(r).toBe(0xa9)
    expect(g).toBe(0xa9)
    expect(b).toBe(0xa9)
  })
})
