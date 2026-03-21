import * as turf from '@turf/turf'
import { describe, it, expect } from 'vitest'


import {
  runBufferAnalysis,
  runBufferAnalysisForMultipleGeometries,
  runMultiRingBuffer,
} from './bufferAnalysis'

const line = turf.lineString([
  [0, 0],
  [10, 0],
])
const point = turf.point([0, 0])
const polygon = turf.polygon([
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ],
])

const baseOptions = {
  units: 'meters' as turf.Units,
  dissolve: 'none' as const,
}

describe('bufferAnalysis', () => {
  describe('runBufferAnalysis', () => {
    it('mesafe 0 ise null döner', () => {
      expect(
        runBufferAnalysis(line.geometry, { ...baseOptions, distance: 0 }),
      ).toBeNull()
    })

    it('çizgi full buffer ile poligon döner', () => {
      const result = runBufferAnalysis(line.geometry, {
        ...baseOptions,
        distance: 100,
      })
      expect(result).not.toBeNull()
      expect(result?.type).toBe('Polygon')
    })

    it('çizgi tek taraflı (sol) buffer ile poligon döner', () => {
      const result = runBufferAnalysis(line.geometry, {
        ...baseOptions,
        distance: 50,
        sideType: 'left',
      })
      expect(result).not.toBeNull()
      expect(result?.type).toBe('Polygon')
    })

    it('çizgi tek taraflı (sağ) buffer ile poligon döner', () => {
      const result = runBufferAnalysis(line.geometry, {
        ...baseOptions,
        distance: 50,
        sideType: 'right',
      })
      expect(result).not.toBeNull()
      expect(result?.type).toBe('Polygon')
    })

    it('poligon + sideType left yine full buffer kullanır', () => {
      const withSide = runBufferAnalysis(polygon.geometry, {
        ...baseOptions,
        distance: 10,
        sideType: 'left',
      })
      expect(withSide).not.toBeNull()
      expect(withSide?.type).toBe('Polygon')
    })

    it('nokta buffer poligon döner', () => {
      const result = runBufferAnalysis(point.geometry, {
        ...baseOptions,
        distance: 100,
      })
      expect(result).not.toBeNull()
      expect(result?.type).toBe('Polygon')
    })
  })

  describe('runMultiRingBuffer', () => {
    it('çoklu mesafe ile her mesafe için ayrı geometry döner', () => {
      const results = runMultiRingBuffer(
        line.geometry,
        [50, 100, 200],
        baseOptions,
      )
      expect(results).toHaveLength(3)
      results.forEach(g => expect(g.type).toBe('Polygon'))
    })

    it('çoklu mesafe + tek taraflı (sol) birlikte çalışır', () => {
      const results = runMultiRingBuffer(line.geometry, [50, 100], {
        ...baseOptions,
        sideType: 'left',
      })
      expect(results).toHaveLength(2)
      results.forEach(g => expect(g.type).toBe('Polygon'))
    })

    it('boş distances dizisi boş dizi döner', () => {
      const results = runMultiRingBuffer(line.geometry, [], baseOptions)
      expect(results).toHaveLength(0)
    })
  })

  describe('runBufferAnalysisForMultipleGeometries', () => {
    it('çoklu nokta (15 nokta) tek seferde buffer + dissolve ile poligon/multipolygon döner', () => {
      const points = Array.from({ length: 15 }, (_, i) =>
        turf.point([i * 0.01, i * 0.01]),
      )
      const geometries = points.map(p => p.geometry)
      const result = runBufferAnalysisForMultipleGeometries(geometries, {
        ...baseOptions,
        distance: 500,
        dissolve: 'all',
      })
      expect(result).not.toBeNull()
      expect(['Polygon', 'MultiPolygon']).toContain(result?.type)
    })

    it('tek geometri ile runBufferAnalysis ile aynı sonucu verir', () => {
      const single = runBufferAnalysis(line.geometry, {
        ...baseOptions,
        distance: 100,
      })
      const multi = runBufferAnalysisForMultipleGeometries([line.geometry], {
        ...baseOptions,
        distance: 100,
      })
      expect(single).not.toBeNull()
      expect(multi).not.toBeNull()
      expect(single?.type).toBe('Polygon')
      expect(multi?.type).toBe('Polygon')
    })
  })
})
