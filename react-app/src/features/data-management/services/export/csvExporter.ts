import Papa from 'papaparse'

import type { DataItem } from '../../types'
import { representativeCoord } from './exportCoords'

export function exportAsCsv(items: DataItem[]): Blob {
  const rows = items.map((item) => {
    const ll = representativeCoord(item.geometry)
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      date: item.date ?? '',
      enlem: ll?.lat ?? '',
      boylam: ll?.lng ?? '',
      geometryType: item.geometry.type,
      geometry: JSON.stringify(item.geometry),
      properties: JSON.stringify(item.properties ?? {}),
    }
  })

  const csv = Papa.unparse(rows)
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
}
