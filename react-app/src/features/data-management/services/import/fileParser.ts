import { parseCsv } from './csvProcessor'
import { parseExcel } from './excelProcessor'
import { parseGeoJSON } from './geoJsonProcessor'
import { parseKML } from './kmlProcessor'
import { parseShapefile } from './shapefileProcessor'
import type { ParseResult } from '../../types'

export async function parseFile(file: File): Promise<ParseResult> {
  const fileName = file.name.split('.')[0]
  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  switch (extension) {
    case 'json':
    case 'geojson': {
      const text = await file.text()
      const json = JSON.parse(text)
      const items = parseGeoJSON(json, fileName)
      return { items }
    }

    case 'csv':
      return await parseCsv(file)

    case 'xlsx':
    case 'xls':
      return await parseExcel(file)

    case 'kml': {
      const text = await file.text()
      const items = await parseKML(text, fileName)
      return { items }
    }

    case 'zip': {
      const buffer = await file.arrayBuffer()
      const items = await parseShapefile(buffer, fileName)
      return { items }
    }

    default:
      throw new Error(`Desteklenmeyen dosya formati: ${extension}`)
  }
}

