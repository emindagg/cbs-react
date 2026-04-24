/**
 * Global type declarations for third-party modules
 */

declare module 'togeojson' {
  export function kml(doc: Document): GeoJSON.FeatureCollection
  export function gpx(doc: Document): GeoJSON.FeatureCollection
}

declare module 'polylabel' {
  type Position = [number, number]
  type Ring = Position[]
  type Polygon = Ring[]
  type LabelPoint = Position & { distance: number }

  export default function polylabel(
    polygon: Polygon,
    precision?: number,
    debug?: boolean,
  ): LabelPoint
}
