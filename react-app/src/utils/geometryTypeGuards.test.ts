import { describe, it, expect } from 'vitest'

import {
  isPolygon,
  isMultiPolygon,
  isPolygonOrMultiPolygon,
  isPoint,
  isMultiPoint,
  isLineString,
  isMultiLineString,
} from './geometryTypeGuards'

describe('geometryTypeGuards', () => {
  describe('isPolygon', () => {
    it('should return true for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isPolygon(geometry)).toBe(true)
    })

    it('should return false for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isPolygon(geometry)).toBe(false)
    })

    it('should return false for MultiPolygon geometry', () => {
      const geometry: GeoJSON.MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      }

      expect(isPolygon(geometry)).toBe(false)
    })

    it('should return false for LineString geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isPolygon(geometry)).toBe(false)
    })
  })

  describe('isMultiPolygon', () => {
    it('should return true for MultiPolygon geometry', () => {
      const geometry: GeoJSON.MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      }

      expect(isMultiPolygon(geometry)).toBe(true)
    })

    it('should return false for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isMultiPolygon(geometry)).toBe(false)
    })

    it('should return false for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isMultiPolygon(geometry)).toBe(false)
    })
  })

  describe('isPolygonOrMultiPolygon', () => {
    it('should return true for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isPolygonOrMultiPolygon(geometry)).toBe(true)
    })

    it('should return true for MultiPolygon geometry', () => {
      const geometry: GeoJSON.MultiPolygon = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      }

      expect(isPolygonOrMultiPolygon(geometry)).toBe(true)
    })

    it('should return false for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isPolygonOrMultiPolygon(geometry)).toBe(false)
    })

    it('should return false for LineString geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isPolygonOrMultiPolygon(geometry)).toBe(false)
    })
  })

  describe('isPoint', () => {
    it('should return true for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isPoint(geometry)).toBe(true)
    })

    it('should return false for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isPoint(geometry)).toBe(false)
    })

    it('should return false for MultiPoint geometry', () => {
      const geometry: GeoJSON.MultiPoint = {
        type: 'MultiPoint',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isPoint(geometry)).toBe(false)
    })
  })

  describe('isMultiPoint', () => {
    it('should return true for MultiPoint geometry', () => {
      const geometry: GeoJSON.MultiPoint = {
        type: 'MultiPoint',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isMultiPoint(geometry)).toBe(true)
    })

    it('should return false for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isMultiPoint(geometry)).toBe(false)
    })

    it('should return false for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isMultiPoint(geometry)).toBe(false)
    })
  })

  describe('isLineString', () => {
    it('should return true for LineString geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isLineString(geometry)).toBe(true)
    })

    it('should return false for Point geometry', () => {
      const geometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [0, 0],
      }

      expect(isLineString(geometry)).toBe(false)
    })

    it('should return false for MultiLineString geometry', () => {
      const geometry: GeoJSON.MultiLineString = {
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      }

      expect(isLineString(geometry)).toBe(false)
    })
  })

  describe('isMultiLineString', () => {
    it('should return true for MultiLineString geometry', () => {
      const geometry: GeoJSON.MultiLineString = {
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0],
            [1, 1],
          ],
        ],
      }

      expect(isMultiLineString(geometry)).toBe(true)
    })

    it('should return false for LineString geometry', () => {
      const geometry: GeoJSON.LineString = {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      }

      expect(isMultiLineString(geometry)).toBe(false)
    })

    it('should return false for Polygon geometry', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      expect(isMultiLineString(geometry)).toBe(false)
    })
  })

  describe('type narrowing', () => {
    it('should narrow Polygon type correctly', () => {
      const geometry: GeoJSON.Geometry = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      }

      if (isPolygon(geometry)) {
        // TypeScript should know geometry is GeoJSON.Polygon here
        expect(geometry.type).toBe('Polygon')
        expect(Array.isArray(geometry.coordinates)).toBe(true)
      }
    })

    it('should narrow MultiPolygon type correctly', () => {
      const geometry: GeoJSON.Geometry = {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      }

      if (isMultiPolygon(geometry)) {
        // TypeScript should know geometry is GeoJSON.MultiPolygon here
        expect(geometry.type).toBe('MultiPolygon')
        expect(Array.isArray(geometry.coordinates)).toBe(true)
      }
    })

    it('should narrow Point type correctly', () => {
      const geometry: GeoJSON.Geometry = {
        type: 'Point',
        coordinates: [0, 0],
      }

      if (isPoint(geometry)) {
        // TypeScript should know geometry is GeoJSON.Point here
        expect(geometry.type).toBe('Point')
        expect(Array.isArray(geometry.coordinates)).toBe(true)
        expect(geometry.coordinates).toHaveLength(2)
      }
    })
  })
})
