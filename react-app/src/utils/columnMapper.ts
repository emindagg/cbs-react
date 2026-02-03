/**
 * Column Mapper
 * Handles Excel/CSV file reading and column mapping with Turkish province/district data
 */

import * as XLSX from 'xlsx'

import type { ColumnMapping, MatchResults } from '../types/visualization'
import { detectColumns } from './columnMapper/columnDetector'
import { parseCSV } from './columnMapper/csvParser'
import { matchData } from './columnMapper/dataMatcher'
import type { ColumnDetectionResult, ColumnMapperIndexes, FileInfo, RawDataRow } from './columnMapper/types'

export class ColumnMapper {
  rawData: RawDataRow[] | null = null
  columns: string[] = []
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
  async loadFile(file: File): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase()
      const isCSV = fileName.endsWith('.csv')

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          let jsonData: RawDataRow[]

          if (isCSV) {
            const text = e.target?.result as string
            jsonData = parseCSV(text)
          } else {
            const data = new Uint8Array(e.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]
            jsonData = XLSX.utils.sheet_to_json(worksheet) as RawDataRow[]
          }

          if (!jsonData || jsonData.length === 0) {
            reject(new Error('Dosyada veri bulunamadı'))
            return
          }

          this.rawData = jsonData
          this.columns = Object.keys(jsonData[0])

          console.debug('✅ File loaded:', jsonData.length, 'rows')
          console.debug('📊 Columns:', this.columns)

          resolve({
            rowCount: jsonData.length,
            columns: this.columns,
            preview: jsonData.slice(0, 3),
          })
        } catch (error) {
          console.error('File read error:', error)
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Dosya okunamadı'))

      if (isCSV) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
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
