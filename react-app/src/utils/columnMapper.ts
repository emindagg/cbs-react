/**
 * Column Mapper
 * Handles Excel/CSV file reading and column mapping with Turkish province/district data
 */

import type { ColumnMapping, MatchResults } from '../types/visualization'
import { detectColumns } from './columnMapper/columnDetector'
import { parseCSV } from './columnMapper/csvParser'
import { matchData } from './columnMapper/dataMatcher'
import { analyzeExcelArrayBuffer, finalizeExcelSelection } from './columnMapper/excelParser'
import type {
  ColumnDetectionResult,
  ColumnMapperIndexes,
  ExcelSelectionPreview,
  FileLoadResult,
  ExcelWorkerOutput,
  FileInfo,
  ParsedExcelResult,
  PendingExcelSelection,
  RawDataRow,
} from './columnMapper/types'

function toFileInfo(result: ParsedExcelResult): FileInfo {
  return {
    rowCount: result.rows.length,
    columns: result.columns,
    preview: result.preview,
    warnings: result.warnings,
    stats: result.stats,
  }
}

async function parseExcelWithWorker(
  file: File,
): Promise<PendingExcelSelection & { preview: ExcelSelectionPreview }> {
  const buffer = await file.arrayBuffer()

  if (typeof Worker === 'undefined') {
    return analyzeExcelArrayBuffer(buffer)
  }

  return await new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./columnMapper/excelWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<ExcelWorkerOutput>) => {
      worker.terminate()
      if (event.data.success) {
        resolve(event.data.result)
      } else {
        const error = new Error(event.data.error.message)
        if (event.data.error.code) {
          Object.assign(error, {
            code: event.data.error.code,
            meta: event.data.error.meta,
          })
        }
        reject(error)
      }
    }

    worker.onerror = () => {
      worker.terminate()
      reject(new Error('Excel çalışma sayfası işlenirken beklenmeyen bir hata oluştu.'))
    }

    worker.postMessage({ buffer }, [buffer])
  })
}

export class ColumnMapper {
  rawData: RawDataRow[] | null = null
  columns: string[] = []
  private pendingExcelSelection: PendingExcelSelection | null = null
  columnMapping: ColumnMapping = {
    locationColumn: null,
    districtColumn: null,
    dataColumn: null,
    locationLevel: 'province',
  }

  // Province and district indexes (will be set from store)
  private indexes: ColumnMapperIndexes = {
    provinceIndex: null,
    districtIndex: null,
  }

  constructor() { }

  /**
   * Set province and district indexes
   */
  setIndexes(
    provinceIndex: ColumnMapperIndexes['provinceIndex'],
    districtIndex: ColumnMapperIndexes['districtIndex'],
  ) {
    this.indexes.provinceIndex = provinceIndex
    this.indexes.districtIndex = districtIndex
  }

  /**
   * Load Excel/CSV file and parse it
   */
  async loadFile(file: File): Promise<FileLoadResult> {
    const fileName = file.name.toLowerCase()
    const isCSV = fileName.endsWith('.csv')

    try {
      let jsonData: RawDataRow[]

      if (isCSV) {
        const text = await file.text()
        jsonData = parseCSV(text)

        if (!jsonData || jsonData.length === 0) {
          throw new Error('Dosyada veri bulunamadı')
        }

        this.rawData = jsonData
        this.columns = Object.keys(jsonData[0])
        this.pendingExcelSelection = null
        const fileInfo: FileInfo = {
          rowCount: jsonData.length,
          columns: this.columns,
          preview: jsonData.slice(0, 3),
        }
        return { kind: 'ready', fileInfo }
      } else {
        const result = await parseExcelWithWorker(file)
        this.rawData = null
        this.columns = []
        this.pendingExcelSelection = {
          matrix: result.matrix,
          firstNonEmptyRow: result.firstNonEmptyRow,
          lastNonEmptyRow: result.lastNonEmptyRow,
          suggestedHeaderRowIndex: result.suggestedHeaderRowIndex,
        }

        return {
          kind: 'needs-header-selection',
          pending: result,
        }
      }
    } catch (error) {
      console.error('File read error:', error)
      throw error
    }
  }

  finalizeExcelSelection(headerRowIndex: number | null, dataStartRowIndex: number): FileInfo {
    if (!this.pendingExcelSelection) {
      throw new Error('Excel önizlemesi hazır değil')
    }

    const result = finalizeExcelSelection(this.pendingExcelSelection, headerRowIndex, dataStartRowIndex)
    const jsonData = result.rows

    if (!jsonData || jsonData.length === 0) {
      throw new Error('Dosyada veri bulunamadı')
    }

    this.rawData = jsonData
    this.columns = result.columns
    this.pendingExcelSelection = null

    console.debug('✅ Excel finalized:', jsonData.length, 'rows')
    console.debug('📊 Columns:', this.columns)

    return toFileInfo(result)
  }

  /**
   * Smart column detection - automatic suggestions
   */
  detectColumns(): ColumnDetectionResult | null {
    return detectColumns(this.rawData, this.columns)
  }

  /**
   * Detect numeric columns
   */
  detectNumericColumns(): string[] {
    // This functionality is now part of columnDetector
    // Keeping for backward compatibility
    if (!this.rawData || this.rawData.length === 0) {
      return []
    }

    const numericColumns: string[] = []
    const NUMERIC_THRESHOLD = 0.8

    for (const col of this.columns) {
      let numericCount = 0
      let totalCount = 0

      for (const row of this.rawData) {
        const value = row[col]
        if (value !== null && value !== undefined && value !== '') {
          totalCount++
          if (typeof value === 'number' || !isNaN(Number(value))) {
            numericCount++
          }
        }
      }

      if (totalCount > 0 && numericCount / totalCount > NUMERIC_THRESHOLD) {
        numericColumns.push(col)
      }
    }

    return numericColumns
  }

  /**
   * Set column mapping
   */
  setColumnMapping(mapping: Partial<ColumnMapping>) {
    this.columnMapping = { ...this.columnMapping, ...mapping }
  }

  /**
   * Match data with province/district GeoJSON
   */
  matchData(): MatchResults {
    if (!this.rawData) {
      throw new Error('Veri yüklenmedi')
    }

    return matchData(this.rawData, this.columnMapping, this.indexes)
  }

  /**
   * Resolve bulk ambiguity for a location name
   */
  resolveBulkAmbiguity(_locationName: string, _selectedOption: Record<string, unknown>): number {
    // This will be implemented when we have match results in state
    // For now, just return 0
    return 0
  }

  /**
   * Get matched data (only successful matches)
   */
  getMatchedData(): RawDataRow[] {
    // This will be implemented after matchData is called
    // For now, return empty array
    return []
  }

  /**
   * Get summary of match results
   */
  getSummary(): { successful: number; ambiguous: number; failed: number } {
    // This will be implemented after matchData is called
    return { successful: 0, ambiguous: 0, failed: 0 }
  }
}
