/**
 * Data Import Feature
 * Barrel export for clean imports
 */

// Main component
export { DataImportSection } from './components/DataImportSection'

// Modal
export { default as ColumnMapperModal } from './components/ColumnMapperModal'

// Sub-components (if needed elsewhere)
export { UrlImporter } from './components/UrlImporter'

// Hooks
export { useFileImport } from './hooks/useFileImport'
export { useUrlImport } from './hooks/useUrlImport'

// Services (if needed elsewhere)
export { parseFile } from './services/fileParser'
export { parseGeoJSON } from './services/geoJsonProcessor'
export { parseExcel } from './services/excelProcessor'
export { parseKML } from './services/kmlProcessor'
export { parseShapefile } from './services/shapefileProcessor'

// Utilities
export { detectColumns } from './utils/columnDetector'
export { transformToGeoItems } from './utils/dataMapper'

// Types
export type * from './types'

// Constants
export { SUPPORTED_IMPORT_FORMATS, EXPORT_FORMATS, FILE_ACCEPT_PATTERN, COLUMN_PATTERNS } from './constants/formats'
