/**
 * Import/Export - Barrel Export
 * Data import and export in multiple formats
 */

// Main import/export manager
// Note: Individual format handlers will be extracted in future refactoring
// Current structure: All functionality in import-export-manager.js
export { ImportExport } from './import-export-manager.js';

// Column mapping utilities (CSV import configuration)
export { ColumnMapping } from './column-mapping.js';

// Report generation and export
export { ReportGeneration } from './report-generation.js';

// Legacy global exports for backward compatibility
if (typeof window !== 'undefined') {
    // ImportExport class is already exported to window by the manager file
}
