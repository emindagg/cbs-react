import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'

import { analyzeWorksheetForSelection, finalizeExcelSelection, parseWorksheetToTable } from './excelParser'
import { ExcelParseError } from './types'

function createSheet(data: Array<Array<string | number | null | undefined>>) {
  return XLSX.utils.aoa_to_sheet(data)
}

describe('parseWorksheetToTable', () => {
  it('detects the actual header row after empty and title rows', () => {
    const sheet = XLSX.utils.aoa_to_sheet([])
    XLSX.utils.sheet_add_aoa(sheet, [['2024 Türkiye il bazlı özet raporu']], { origin: 'A3' })
    XLSX.utils.sheet_add_aoa(sheet, [
      ['İl', 'Değer', 'Not'],
      ['Ankara', 10, 'Merkez'],
      ['İzmir', 20, 'Kıyı'],
    ], { origin: 'A4' })

    const result = parseWorksheetToTable(sheet)

    expect(result.columns).toEqual(['İl', 'Değer', 'Not'])
    expect(result.rows).toEqual([
      { İl: 'Ankara', Değer: '10', Not: 'Merkez' },
      { İl: 'İzmir', Değer: '20', Not: 'Kıyı' },
    ])
    expect(result.stats.mode).toBe('header-row')
    expect(result.stats.headerRowIndex).toBe(3)
    expect(result.stats.leadingEmptyRowsSkipped).toBe(2)
    expect(result.stats.titleRowsSkipped).toBe(1)
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'LEADING_EMPTY_ROWS_SKIPPED',
      'TITLE_ROWS_SKIPPED',
    ])
  })

  it('fills blank headers, renames duplicates and removes empty columns', () => {
    const sheet = createSheet([
      ['İl', '', 'Değer', 'Değer', '', ''],
      ['Ankara', 'Merkez', 10, 11, '', ''],
      ['İzmir', 'Konak', 20, 21, '', ''],
    ])

    const result = parseWorksheetToTable(sheet)

    expect(result.columns).toEqual(['İl', 'Kolon B', 'Değer', 'Değer (2)'])
    expect(result.rows).toEqual([
      { İl: 'Ankara', 'Kolon B': 'Merkez', Değer: '10', 'Değer (2)': '11' },
      { İl: 'İzmir', 'Kolon B': 'Konak', Değer: '20', 'Değer (2)': '21' },
    ])
    expect(result.stats.emptyColumnsRemoved).toBe(2)
    expect(result.warnings.map((warning) => warning.code)).toEqual([
      'EMPTY_COLUMNS_REMOVED',
      'BLANK_HEADERS_FILLED',
      'DUPLICATE_HEADERS_RENAMED',
    ])
  })

  it('removes completely empty rows after the detected header', () => {
    const sheet = createSheet([
      ['İl', 'Değer'],
      ['Ankara', 10],
      [],
      ['İzmir', 20],
      ['  ', '  '],
      ['Bursa', 30],
    ])

    const result = parseWorksheetToTable(sheet)

    expect(result.rows).toEqual([
      { İl: 'Ankara', Değer: '10' },
      { İl: 'İzmir', Değer: '20' },
      { İl: 'Bursa', Değer: '30' },
    ])
    expect(result.stats.emptyRowsRemoved).toBe(2)
  })

  it('supports headerless mode when the user marks the first data row manually', () => {
    const sheet = XLSX.utils.aoa_to_sheet([])
    XLSX.utils.sheet_add_aoa(sheet, [['2024 notu']], { origin: 'A1' })
    XLSX.utils.sheet_add_aoa(sheet, [
      ['Ankara', 10],
      ['İzmir', 20],
      ['Bursa', 30],
    ], { origin: 'A3' })

    const preview = analyzeWorksheetForSelection(sheet)
    const result = finalizeExcelSelection(preview, 'no-header', 2)

    expect(result.columns).toEqual(['Kolon A', 'Kolon B'])
    expect(result.rows).toEqual([
      { 'Kolon A': 'Ankara', 'Kolon B': '10' },
      { 'Kolon A': 'İzmir', 'Kolon B': '20' },
      { 'Kolon A': 'Bursa', 'Kolon B': '30' },
    ])
    expect(result.stats.mode).toBe('no-header')
    expect(result.stats.dataStartRowIndex).toBe(2)
  })

  it('throws a controlled error when no reliable header row exists', () => {
    const sheet = createSheet([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])

    expect(() => parseWorksheetToTable(sheet)).toThrowError(ExcelParseError)

    try {
      parseWorksheetToTable(sheet)
    } catch (error) {
      expect(error).toBeInstanceOf(ExcelParseError)
      expect((error as ExcelParseError).code).toBe('HEADER_NOT_FOUND')
    }
  })

  it('still opens preview for headerless numeric data by falling back to the first visible row', () => {
    const sheet = createSheet([
      [100, 200, 300],
      [400, 500, 600],
    ])

    const preview = analyzeWorksheetForSelection(sheet)

    expect(preview.preview.hasReliableHeaderSuggestion).toBe(false)
    expect(preview.preview.suggestedHeaderRowIndex).toBe(0)
    expect(preview.preview.previewRowIndices).toEqual([0, 1])
  })
})
