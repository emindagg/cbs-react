import type { Geometry } from 'geojson'
import * as XLSX from 'xlsx'

import type { DataItem } from '../../types'

/** GeoJSON [lng, lat] — çizgi/alan için ilk köşe (temsilî); yoksa boş. */
function representativeEnlemBoylam(geom: Geometry): { enlem: number; boylam: number } | null {
  const pair = (c: number[]): { enlem: number; boylam: number } | null => {
    if (c.length < 2 || typeof c[0] !== 'number' || typeof c[1] !== 'number') return null
    return { boylam: c[0], enlem: c[1] }
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
        const p = representativeEnlemBoylam(g)
        if (p) return p
      }
      return null
    default:
      return null
  }
}

interface ExportRow {
  id: string
  name: string
  type: string
  date: string
  enlem: number | ''
  boylam: number | ''
  geometryType: string
  geometry: string
  properties: string
}

export function exportAsExcel(items: DataItem[]): Blob {
  const rows: ExportRow[] = items.map((item) => {
    const ll = representativeEnlemBoylam(item.geometry)
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      date: item.date ?? '',
      enlem: ll?.enlem ?? '',
      boylam: ll?.boylam ?? '',
      geometryType: item.geometry.type,
      geometry: JSON.stringify(item.geometry),
      properties: JSON.stringify(item.properties ?? {}),
    }
  })

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'GeoData')

  const buffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  })

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

