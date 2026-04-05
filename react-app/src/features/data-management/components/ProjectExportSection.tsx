import { ExportControls } from './ExportControls'
import { useDataExport } from '../hooks/useDataExport'

export function ProjectExportSection() {
  const dataExport = useDataExport()

  return (
    <ExportControls
      exportFormat={dataExport.exportFormat}
      onFormatChange={dataExport.setExportFormat}
      onExport={dataExport.handleExport}
      exportButtonLabel="Projeyi İndir"
      geojsonMinified={dataExport.geojsonMinified}
      onGeojsonMinifiedChange={dataExport.setGeojsonMinified}
    />
  )
}
