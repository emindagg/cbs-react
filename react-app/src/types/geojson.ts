/**
 * GeoJSON Type Definitions
 * Common types for working with Turkish geographic data
 */

export interface GeoJSONProperties {
  // Province properties (TÜİK standart)
  ADI?: string
  BOLGE_ADI?: string
  NUTS1?: string
  NUTS2?: string
  NUTS3?: string
  YERLESIMKO?: number
  ILAD?: string
  IL_ADI?: string
  il_adi?: string
  province?: string
  PROVINCE?: string
  IL?: string
  adm1_tr?: string
  adm1_en?: string

  // District properties
  ILCEAD?: string
  ILCE_ADI?: string
  ilce_adi?: string
  ilce?: string
  ILCE?: string
  district?: string

  // Display properties
  name?: string
  NAME?: string
  displayName?: string
  value?: number
  dataValue?: number
  color?: string
  hasData?: boolean

  // Allow other properties from various GeoJSON sources
  [key: string]: unknown
}

export interface GeoJSONGeometry {
  type: string
  coordinates: unknown
}

export interface GeoJSONFeature {
  type: 'Feature'
  properties: GeoJSONProperties
  geometry: GeoJSONGeometry
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

/**
 * Location info with normalized data
 */
export interface LocationInfo {
  name: string
  properties: GeoJSONProperties
  geometry: GeoJSONGeometry
}

/**
 * District info with province reference
 */
export interface DistrictInfo extends LocationInfo {
  province: string
  compositeKey: string
}
