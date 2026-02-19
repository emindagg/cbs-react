import type { Geometry, Position } from 'geojson'

import type { DataItem } from '../../types'

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function coordToText(coord: Position): string {
  const [lng, lat, alt] = coord
  return alt === undefined ? `${lng},${lat}` : `${lng},${lat},${alt}`
}

function pointKml(coord: Position): string {
  return `<Point><coordinates>${coordToText(coord)}</coordinates></Point>`
}

function lineKml(coords: Position[]): string {
  return `<LineString><coordinates>${coords.map(coordToText).join(' ')}</coordinates></LineString>`
}

function polygonKml(coords: Position[][]): string {
  if (coords.length === 0) return ''
  const outer = coords[0]
  const inner = coords.slice(1)
  const outerBoundary = `<outerBoundaryIs><LinearRing><coordinates>${outer.map(coordToText).join(' ')}</coordinates></LinearRing></outerBoundaryIs>`
  const innerBoundaries = inner
    .map(ring => `<innerBoundaryIs><LinearRing><coordinates>${ring.map(coordToText).join(' ')}</coordinates></LinearRing></innerBoundaryIs>`)
    .join('')
  return `<Polygon>${outerBoundary}${innerBoundaries}</Polygon>`
}

function multiGeometryKml(children: string[]): string {
  return `<MultiGeometry>${children.join('')}</MultiGeometry>`
}

function geometryToKml(geometry: Geometry): string {
  switch (geometry.type) {
    case 'Point':
      return pointKml(geometry.coordinates)
    case 'MultiPoint':
      return multiGeometryKml(geometry.coordinates.map(pointKml))
    case 'LineString':
      return lineKml(geometry.coordinates)
    case 'MultiLineString':
      return multiGeometryKml(geometry.coordinates.map(lineKml))
    case 'Polygon':
      return polygonKml(geometry.coordinates)
    case 'MultiPolygon':
      return multiGeometryKml(geometry.coordinates.map(polygonKml))
    case 'GeometryCollection':
      return multiGeometryKml(geometry.geometries.map(geometryToKml))
    default:
      return ''
  }
}

function descriptionForItem(item: DataItem): string {
  if (!item.properties || Object.keys(item.properties).length === 0) return ''
  return Object.entries(item.properties)
    .map(([key, value]) => `${escapeXml(key)}: ${escapeXml(String(value ?? ''))}`)
    .join('\n')
}

export function exportAsKml(items: DataItem[]): Blob {
  const placemarks = items
    .map((item) => {
      const geometryXml = geometryToKml(item.geometry)
      if (!geometryXml) return ''

      const description = descriptionForItem(item)
      return [
        '<Placemark>',
        `<name>${escapeXml(item.name)}</name>`,
        description ? `<description>${escapeXml(description)}</description>` : '',
        geometryXml,
        '</Placemark>',
      ].join('')
    })
    .filter(Boolean)
    .join('')

  const kml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    '<Document>',
    placemarks,
    '</Document>',
    '</kml>',
  ].join('')

  return new Blob([kml], {
    type: 'application/vnd.google-earth.kml+xml',
  })
}

