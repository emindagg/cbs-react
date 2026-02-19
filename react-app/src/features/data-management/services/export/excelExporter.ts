import * as XLSX from 'xlsx'

import type { DataItem } from '../../types'

interface ExportRow {
  id: string
  name: string
  type: string
  date: string
  geometryType: string
  geometry: string
  properties: string
}

export function exportAsExcel(items: DataItem[]): Blob {
  const rows: ExportRow[] = items.map(item => ({
    id: item.id,
    name: item.name,
    type: item.type,
    date: item.date ?? '',
    geometryType: item.geometry.type,
    geometry: JSON.stringify(item.geometry),
    properties: JSON.stringify(item.properties ?? {}),
  }))

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

