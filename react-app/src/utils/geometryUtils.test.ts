import { describe, it, expect } from 'vitest'

import { mockPolygonFeature, mockMultiPolygonFeature } from '@/test/mockData'

import { calculateCentroid, calculateBounds, getBoundsCenter } from './geometryUtils'

describe('geometryUtils', () => {
  describe('calculateCentroid', () => {
    describe('Polygon', () => {
      it('should calculate centroid for simple polygon', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Simple average includes closing point, so centroid is slightly off
        expect(centroid[0]).toBeCloseTo(4, 1) // lng
        expect(centroid[1]).toBeCloseTo(4, 1) // lat
      })

      it('should handle polygon with holes (uses exterior ring only)', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            // Exterior ring
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
            // Hole (should be ignored for centroid)
            [
              [2, 2],
              [8, 2],
              [8, 8],
              [2, 8],
              [2, 2],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Should use exterior ring only (simple average includes closing point)
        expect(centroid[0]).toBeCloseTo(4, 1)
        expect(centroid[1]).toBeCloseTo(4, 1)
      })

      it('should handle triangle', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [5, 10],
              [0, 0],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Simple average of all points including closing point
        expect(centroid[0]).toBeCloseTo(3.75, 1)
        expect(centroid[1]).toBeCloseTo(2.5, 1)
      })

      it('should handle empty coordinates', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[]],
        }

        const centroid = calculateCentroid(geometry)

        expect(centroid).toEqual([0, 0])
      })

      it('should handle negative coordinates', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [-10, -10],
              [0, -10],
              [0, 0],
              [-10, 0],
              [-10, -10],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Simple average includes closing point
        expect(centroid[0]).toBeCloseTo(-6, 1)
        expect(centroid[1]).toBeCloseTo(-6, 1)
      })
    })

    describe('MultiPolygon', () => {
      it('should calculate centroid for multi-polygon', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0],
                [5, 0],
                [5, 5],
                [0, 5],
                [0, 0],
              ],
            ],
            [
              [
                [10, 10],
                [15, 10],
                [15, 15],
                [10, 15],
                [10, 10],
              ],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Should use one of the polygons (implementation uses largest by point count)
        expect(Array.isArray(centroid)).toBe(true)
        expect(centroid).toHaveLength(2)
      })

      it('should use largest polygon by point count', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [
            // Small polygon (4 points)
            [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
            // Large polygon (6 points)
            [
              [
                [10, 10],
                [20, 10],
                [20, 15],
                [15, 20],
                [10, 15],
                [10, 10],
              ],
            ],
          ],
        }

        const centroid = calculateCentroid(geometry)

        // Should use the larger polygon
        expect(centroid[0]).toBeGreaterThan(5)
        expect(centroid[1]).toBeGreaterThan(5)
      })

      it('should handle empty multi-polygon', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [],
        }

        const centroid = calculateCentroid(geometry)

        expect(centroid).toEqual([0, 0])
      })

      it('should handle multi-polygon with empty polygon', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [[[]]],
        }

        const centroid = calculateCentroid(geometry)

        expect(centroid).toEqual([0, 0])
      })
    })

    describe('with mock data', () => {
      it('should calculate centroid for mock polygon feature', () => {
        const feature = mockPolygonFeature('Test', 100)
        const centroid = calculateCentroid(feature.geometry as GeoJSON.Polygon)

        expect(Array.isArray(centroid)).toBe(true)
        expect(centroid).toHaveLength(2)
        expect(centroid[0]).toBeGreaterThan(27)
        expect(centroid[0]).toBeLessThan(30)
      })

      it('should calculate centroid for mock multi-polygon feature', () => {
        const feature = mockMultiPolygonFeature('Test', 100)
        const centroid = calculateCentroid(feature.geometry as GeoJSON.MultiPolygon)

        expect(Array.isArray(centroid)).toBe(true)
        expect(centroid).toHaveLength(2)
      })
    })
  })

  describe('calculateBounds', () => {
    describe('Polygon', () => {
      it('should calculate bounds for simple polygon', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        expect(bounds).toEqual([0, 0, 10, 10])
      })

      it('should handle polygon with holes', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            // Exterior ring
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
            // Hole
            [
              [2, 2],
              [8, 2],
              [8, 8],
              [2, 8],
              [2, 2],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        // Bounds should encompass entire exterior ring
        expect(bounds).toEqual([0, 0, 10, 10])
      })

      it('should handle negative coordinates', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [-10, -10],
              [0, -10],
              [0, 0],
              [-10, 0],
              [-10, -10],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        expect(bounds).toEqual([-10, -10, 0, 0])
      })

      it('should handle mixed positive and negative coordinates', () => {
        const geometry: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [
            [
              [-5, -5],
              [5, -5],
              [5, 5],
              [-5, 5],
              [-5, -5],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        expect(bounds).toEqual([-5, -5, 5, 5])
      })
    })

    describe('MultiPolygon', () => {
      it('should calculate bounds for multi-polygon', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0],
                [5, 0],
                [5, 5],
                [0, 5],
                [0, 0],
              ],
            ],
            [
              [
                [10, 10],
                [15, 10],
                [15, 15],
                [10, 15],
                [10, 10],
              ],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        // Should encompass all polygons
        expect(bounds).toEqual([0, 0, 15, 15])
      })

      it('should handle multi-polygon with gaps', () => {
        const geometry: GeoJSON.MultiPolygon = {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [0, 0],
                [5, 0],
                [5, 5],
                [0, 5],
                [0, 0],
              ],
            ],
            [
              [
                [20, 20],
                [25, 20],
                [25, 25],
                [20, 25],
                [20, 20],
              ],
            ],
          ],
        }

        const bounds = calculateBounds(geometry)

        // Should encompass all polygons including gap
        expect(bounds).toEqual([0, 0, 25, 25])
      })
    })

    describe('with mock data', () => {
      it('should calculate bounds for mock polygon feature', () => {
        const feature = mockPolygonFeature('Test', 100)
        const bounds = calculateBounds(feature.geometry as GeoJSON.Polygon)

        expect(bounds).toHaveLength(4)
        expect(bounds[0]).toBeLessThan(bounds[2]) // minLng < maxLng
        expect(bounds[1]).toBeLessThan(bounds[3]) // minLat < maxLat
      })

      it('should calculate bounds for mock multi-polygon feature', () => {
        const feature = mockMultiPolygonFeature('Test', 100)
        const bounds = calculateBounds(feature.geometry as GeoJSON.MultiPolygon)

        expect(bounds).toHaveLength(4)
        expect(bounds[0]).toBeLessThan(bounds[2])
        expect(bounds[1]).toBeLessThan(bounds[3])
      })
    })
  })

  describe('getBoundsCenter', () => {
    it('should calculate center of bounds', () => {
      const bounds: [number, number, number, number] = [0, 0, 10, 10]
      const center = getBoundsCenter(bounds)

      expect(center).toEqual([5, 5])
    })

    it('should handle negative bounds', () => {
      const bounds: [number, number, number, number] = [-10, -10, 0, 0]
      const center = getBoundsCenter(bounds)

      expect(center).toEqual([-5, -5])
    })

    it('should handle mixed positive and negative bounds', () => {
      const bounds: [number, number, number, number] = [-5, -5, 5, 5]
      const center = getBoundsCenter(bounds)

      expect(center).toEqual([0, 0])
    })

    it('should handle asymmetric bounds', () => {
      const bounds: [number, number, number, number] = [0, 0, 20, 10]
      const center = getBoundsCenter(bounds)

      expect(center).toEqual([10, 5])
    })

    it('should handle fractional coordinates', () => {
      const bounds: [number, number, number, number] = [1.5, 2.5, 3.5, 4.5]
      const center = getBoundsCenter(bounds)

      expect(center[0]).toBeCloseTo(2.5, 5)
      expect(center[1]).toBeCloseTo(3.5, 5)
    })
  })

  describe('integration', () => {
    it('should work together: bounds and center', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      }

      const bounds = calculateBounds(geometry)
      const center = getBoundsCenter(bounds)

      expect(center).toEqual([5, 5])
    })

    it('should work together: centroid and bounds', () => {
      const geometry: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      }

      const centroid = calculateCentroid(geometry)
      const bounds = calculateBounds(geometry)

      // Centroid should be inside bounds
      expect(centroid[0]).toBeGreaterThanOrEqual(bounds[0])
      expect(centroid[0]).toBeLessThanOrEqual(bounds[2])
      expect(centroid[1]).toBeGreaterThanOrEqual(bounds[1])
      expect(centroid[1]).toBeLessThanOrEqual(bounds[3])
    })
  })
})
