import { useState } from 'react'
import toast from 'react-hot-toast'

import { downloadFile } from '../services/export/downloadFile'
import { exportAsExcel } from '../services/export/excelExporter'
import { exportAsGeoJSON } from '../services/export/geojsonExporter'
import { exportAsKml } from '../services/export/kmlExporter'
import { exportAsShapefileZip } from '../services/export/shapefileExporter'
import { useDataManagementStore } from '../store/useDataManagementStore'
import type { ExportFormat } from '../types'

export function useDataExport() {
  const items = useDataManagementStore(state => state.items)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('geojson')

  const handleExport = () => {
    if (items.length === 0) {
      toast.error('Disa aktarilacak veri bulunamadi.')
      return
    }

    try {
      const datePart = new Date().toISOString().slice(0, 10)
      const baseName = `cbs-proje-${datePart}`

      if (exportFormat === 'geojson') {
        const blob = exportAsGeoJSON(items)
        downloadFile(blob, `${baseName}.geojson`)
      } else if (exportFormat === 'kml') {
        const blob = exportAsKml(items)
        downloadFile(blob, `${baseName}.kml`)
      } else if (exportFormat === 'shp') {
        const blob = exportAsShapefileZip(items)
        downloadFile(blob, `${baseName}.zip`)
      } else if (exportFormat === 'xlsx') {
        const blob = exportAsExcel(items)
        downloadFile(blob, `${baseName}.xlsx`)
      }

      toast.success(`Veri ${exportFormat.toUpperCase()} olarak indirildi.`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Disa aktarma sirasinda hata olustu.')
    }
  }

  return {
    exportFormat,
    setExportFormat,
    handleExport,
  }
}

