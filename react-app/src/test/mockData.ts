import type { GeoJSONFeature, GeoJSONFeatureCollection } from '@/types/geojson'

/**
 * Create a mock Polygon feature
 */
export const mockPolygonFeature = (name: string, value: number): GeoJSONFeature => ({
  type: 'Feature',
  properties: {
    ADI: name,
    value,
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [28.0, 41.0],
        [29.0, 41.0],
        [29.0, 42.0],
        [28.0, 42.0],
        [28.0, 41.0],
      ],
    ],
  },
})

/**
 * Create a mock MultiPolygon feature
 */
export const mockMultiPolygonFeature = (name: string, value: number): GeoJSONFeature => ({
  type: 'Feature',
  properties: {
    ADI: name,
    value,
  },
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [28.0, 41.0],
          [29.0, 41.0],
          [29.0, 42.0],
          [28.0, 42.0],
          [28.0, 41.0],
        ],
      ],
      [
        [
          [30.0, 41.0],
          [31.0, 41.0],
          [31.0, 42.0],
          [30.0, 42.0],
          [30.0, 41.0],
        ],
      ],
    ],
  },
})

/**
 * Create a mock Point feature
 */
export const mockPointFeature = (name: string, value: number): GeoJSONFeature => ({
  type: 'Feature',
  properties: {
    name,
    value,
  },
  geometry: {
    type: 'Point',
    coordinates: [28.5, 41.5],
  },
})

/**
 * Create mock user data
 */
export const mockUserData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    location: `City${i}`,
    value: Math.random() * 100,
  }))
}

/**
 * Create mock GeoJSON FeatureCollection
 */
export const mockGeoJSON = (featureCount: number): GeoJSONFeatureCollection => ({
  type: 'FeatureCollection',
  features: Array.from({ length: featureCount }, (_, i) =>
    mockPolygonFeature(`Feature${i}`, i * 10),
  ),
})

/**
 * Create mock GeoJSON with specific values
 */
export const mockGeoJSONWithValues = (values: number[]): GeoJSONFeatureCollection => ({
  type: 'FeatureCollection',
  features: values.map((value, i) => mockPolygonFeature(`Feature${i}`, value)),
})
