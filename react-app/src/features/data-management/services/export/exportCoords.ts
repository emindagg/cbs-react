import type { Geometry } from 'geojson'

/** GeoJSON [lng, lat] — çizgi/alan için ilk köşe (temsilî); yoksa null. */
export function representativeCoord(geom: Geometry): { lat: number; lng: number } | null {
  const pair = (c: number[]): { lat: number; lng: number } | null => {
    if (c.length < 2 || typeof c[0] !== 'number' || typeof c[1] !== 'number') return null
    return { lng: c[0], lat: c[1] }
  }

  switch (geom.type) {
    case 'Point':
      return pair(geom.coordinates as number[])
    case 'MultiPoint':
      return geom.coordinates.length ? pair(geom.coordinates[0] as number[]) : null
    case 'LineString':
      return geom.coordinates.length ? pair(geom.coordinates[0] as number[]) : null
    case 'MultiLineString':
      return geom.coordinates.length && geom.coordinates[0].length
        ? pair(geom.coordinates[0][0] as number[])
        : null
    case 'Polygon':
      return geom.coordinates.length && geom.coordinates[0].length
        ? pair(geom.coordinates[0][0] as number[])
        : null
    case 'MultiPolygon':
      return geom.coordinates.length &&
        geom.coordinates[0].length &&
        geom.coordinates[0][0].length
        ? pair(geom.coordinates[0][0][0] as number[])
        : null
    case 'GeometryCollection':
      for (const g of geom.geometries) {
        const p = representativeCoord(g)
        if (p) return p
      }
      return null
    default:
      return null
  }
}
