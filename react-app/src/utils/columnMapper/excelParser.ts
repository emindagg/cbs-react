import * as XLSX from 'xlsx'
import type { WorkSheet } from 'xlsx'

import {
  ExcelParseError,
  type ExcelSelectionMode,
  type ExcelSelectionPreview,
  type ParsedExcelResult,
  type ParsedExcelStats,
  type ParsedExcelWarning,
  type PendingExcelSelection,
} from './types'

const MAX_SHEET_ROWS = 100_000
const MAX_SHEET_COLUMNS = 512
const MAX_HEADER_SCAN_ROWS = 200
const MAX_PREVIEW_ROWS = 12
const MAX_PREVIEW_COLUMNS = 8
const HEADER_SCORE_THRESHOLD = 28

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\u00A0/g, ' ').trim()
}

function isEmptyRow(row: string[]): boolean {
  return row.every((cell) => cell === '')
}

function getNonEmptyCellIndices(row: string[]): number[] {
  const indices: number[] = []
  row.forEach((cell, index) => {
    if (cell !== '') indices.push(index)
  })
  return indices
}

function hasLetter(value: string): boolean {
  return /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(value)
}

function isNumericLike(value: string): boolean {
  if (!value) return false
  const cleaned = value
    .replace(/[₺$€£%\s]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
  return /^-?\d+(?:\.\d+)?$/.test(cleaned)
}

function countNonEmptyInColumns(row: string[], columns: number[]): number {
  let count = 0
  for (const columnIndex of columns) {
    if ((row[columnIndex] ?? '') !== '') count++
  }
  return count
}

function findFirstNonEmptyRow(matrix: string[][]): number {
  return matrix.findIndex((row) => !isEmptyRow(row))
}

function findLastNonEmptyRow(matrix: string[][]): number {
  for (let rowIndex = matrix.length - 1; rowIndex >= 0; rowIndex--) {
    if (!isEmptyRow(matrix[rowIndex])) return rowIndex
  }
  return -1
}

function buildWorksheetMatrix(sheet: WorkSheet): string[][] {
  const rawMatrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: true,
    skipHidden: true,
  })

  return rawMatrix.map((row) => row.map(normalizeCellValue))
}

function validateMatrixBounds(matrix: string[][]) {
  if (matrix.length === 0) {
    throw new ExcelParseError('EMPTY_SHEET', 'Excel sayfasında veri bulunamadı.')
  }

  const maxColumnCount = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  if (matrix.length > MAX_SHEET_ROWS || maxColumnCount > MAX_SHEET_COLUMNS) {
    throw new ExcelParseError(
      'SHEET_TOO_LARGE',
      'Excel sayfası güvenli işleme sınırını aşıyor.',
      { rowCount: matrix.length, columnCount: maxColumnCount },
    )
  }
}

function scoreHeaderCandidate(matrix: string[][], rowIndex: number, lastNonEmptyRow: number): number {
  const row = matrix[rowIndex] ?? []
  const nonEmptyIndices = getNonEmptyCellIndices(row)
  const nonEmptyValues = nonEmptyIndices.map((index) => row[index])
  const nonEmptyCount = nonEmptyValues.length

  if (nonEmptyCount === 0) return Number.NEGATIVE_INFINITY
  if (nonEmptyCount === 1) {
    return nonEmptyValues[0].length > 24 ? -36 : -24
  }

  const uniqueCount = new Set(nonEmptyValues.map((value) => value.toLocaleLowerCase('tr-TR'))).size
  const textLikeCount = nonEmptyValues.filter(hasLetter).length
  const numericLikeCount = nonEmptyValues.filter(isNumericLike).length
  const longTextCount = nonEmptyValues.filter((value) => value.length > 48).length

  let score = 0
  score += Math.min(nonEmptyCount, 8) * 4
  score += (uniqueCount / nonEmptyCount) * 10
  score += (textLikeCount / nonEmptyCount) * 22
  score -= (numericLikeCount / nonEmptyCount) * 16
  score -= longTextCount * 5
  if (textLikeCount === 0) score -= 24
  if (numericLikeCount / nonEmptyCount >= 0.75) score -= 20

  const sampleRows: string[][] = []
  for (let index = rowIndex + 1; index <= lastNonEmptyRow && sampleRows.length < 5; index++) {
    const nextRow = matrix[index]
    if (!isEmptyRow(nextRow)) {
      sampleRows.push(nextRow)
    }
  }

  if (sampleRows.length === 0) {
    score -= 30
  } else {
    const supportRatios = sampleRows.map((sampleRow) => {
      const supported = countNonEmptyInColumns(sampleRow, nonEmptyIndices)
      return supported / nonEmptyCount
    })
    const averageSupport = supportRatios.reduce((total, value) => total + value, 0) / supportRatios.length
    if (averageSupport >= 0.45) score += 18
    else if (averageSupport >= 0.25) score += 8
    else score -= 12

    const sampleValues = sampleRows.flatMap((sampleRow) => nonEmptyIndices.map((columnIndex) => sampleRow[columnIndex] ?? ''))
    const nonEmptySampleValues = sampleValues.filter((value) => value !== '')
    const sampleNumericRatio = nonEmptySampleValues.length > 0
      ? nonEmptySampleValues.filter((value) => isNumericLike(value)).length / nonEmptySampleValues.length
      : 0
    if (sampleNumericRatio > 0.2) score += 6
  }

  return score
}

function detectSuggestedHeaderRow(matrix: string[][], firstNonEmptyRow: number, lastNonEmptyRow: number): number {
  const scanEnd = Math.min(lastNonEmptyRow, firstNonEmptyRow + MAX_HEADER_SCAN_ROWS)
  let bestRowIndex = -1
  let bestScore = Number.NEGATIVE_INFINITY

  for (let rowIndex = firstNonEmptyRow; rowIndex <= scanEnd; rowIndex++) {
    const score = scoreHeaderCandidate(matrix, rowIndex, lastNonEmptyRow)
    if (score > bestScore) {
      bestScore = score
      bestRowIndex = rowIndex
    }
  }

  if (bestRowIndex === -1 || bestScore < HEADER_SCORE_THRESHOLD) {
    throw new ExcelParseError(
      'HEADER_NOT_FOUND',
      'Excel içinde güvenilir bir başlık satırı bulunamadı.',
      { bestScore },
    )
  }

  return bestRowIndex
}

function buildActiveColumnIndices(matrix: string[][], startRowIndex: number, lastNonEmptyRow: number): number[] {
  const active = new Set<number>()

  for (let rowIndex = startRowIndex; rowIndex <= lastNonEmptyRow; rowIndex++) {
    const row = matrix[rowIndex] ?? []
    row.forEach((cell, columnIndex) => {
      if (cell !== '') active.add(columnIndex)
    })
  }

  return Array.from(active).sort((left, right) => left - right)
}

function buildSyntheticHeaders(activeColumnIndices: number[]): string[] {
  return activeColumnIndices.map((columnIndex) => `Kolon ${XLSX.utils.encode_col(columnIndex)}`)
}

function sanitizeHeaders(
  headerRow: string[],
  activeColumnIndices: number[],
): { columns: string[]; warnings: ParsedExcelWarning[] } {
  const warnings: ParsedExcelWarning[] = []
  const columns: string[] = []
  const usageCounts = new Map<string, number>()

  let blankHeaderCount = 0
  let duplicateHeaderCount = 0

  activeColumnIndices.forEach((columnIndex) => {
    const rawLabel = headerRow[columnIndex] ?? ''
    let label = rawLabel !== '' ? rawLabel : `Kolon ${XLSX.utils.encode_col(columnIndex)}`

    if (rawLabel === '') {
      blankHeaderCount++
    }

    const nextCount = (usageCounts.get(label) ?? 0) + 1
    usageCounts.set(label, nextCount)

    if (nextCount > 1) {
      duplicateHeaderCount++
      label = `${label} (${nextCount})`
    }

    columns.push(label)
  })

  if (blankHeaderCount > 0) {
    warnings.push({
      code: 'BLANK_HEADERS_FILLED',
      message: `${blankHeaderCount} boş başlık otomatik olarak dolduruldu.`,
      meta: { count: blankHeaderCount },
    })
  }

  if (duplicateHeaderCount > 0) {
    warnings.push({
      code: 'DUPLICATE_HEADERS_RENAMED',
      message: `${duplicateHeaderCount} yinelenen başlık yeniden adlandırıldı.`,
      meta: { count: duplicateHeaderCount },
    })
  }

  return { columns, warnings }
}

function buildRowObjects(
  matrix: string[][],
  columns: string[],
  activeColumnIndices: number[],
  dataStartRowIndex: number,
  lastNonEmptyRow: number,
): { rows: Record<string, string>[]; emptyRowsRemoved: number } {
  const rows: Record<string, string>[] = []
  let emptyRowsRemoved = 0

  for (let rowIndex = dataStartRowIndex; rowIndex <= lastNonEmptyRow; rowIndex++) {
    const sourceRow = matrix[rowIndex] ?? []
    const values = activeColumnIndices.map((columnIndex) => sourceRow[columnIndex] ?? '')

    if (values.every((value) => value === '')) {
      emptyRowsRemoved++
      continue
    }

    const row: Record<string, string> = {}
    columns.forEach((column, index) => {
      row[column] = values[index]
    })
    rows.push(row)
  }

  return { rows, emptyRowsRemoved }
}

function buildWarnings(stats: ParsedExcelStats): ParsedExcelWarning[] {
  const warnings: ParsedExcelWarning[] = []

  if (stats.leadingEmptyRowsSkipped > 0) {
    warnings.push({
      code: 'LEADING_EMPTY_ROWS_SKIPPED',
      message: `${stats.leadingEmptyRowsSkipped} boş üst satır atlandı.`,
      meta: { count: stats.leadingEmptyRowsSkipped },
    })
  }

  if (stats.titleRowsSkipped > 0) {
    warnings.push({
      code: 'TITLE_ROWS_SKIPPED',
      message: `${stats.titleRowsSkipped} açıklama/başlık satırı atlandı.`,
      meta: { count: stats.titleRowsSkipped },
    })
  }

  if (stats.emptyColumnsRemoved > 0) {
    warnings.push({
      code: 'EMPTY_COLUMNS_REMOVED',
      message: `${stats.emptyColumnsRemoved} boş sütun temizlendi.`,
      meta: { count: stats.emptyColumnsRemoved },
    })
  }

  return warnings
}

function buildPreviewRows(
  matrix: string[][],
  firstNonEmptyRow: number,
  lastNonEmptyRow: number,
  suggestedHeaderRowIndex: number,
): { previewRows: string[][]; previewRowIndices: number[] } {
  const previewRows: string[][] = []
  const previewRowIndices: number[] = []
  const previewStart = suggestedHeaderRowIndex > firstNonEmptyRow + MAX_PREVIEW_ROWS - 1
    ? Math.max(firstNonEmptyRow, suggestedHeaderRowIndex - 3)
    : firstNonEmptyRow
  const endRow = Math.min(lastNonEmptyRow, previewStart + MAX_PREVIEW_ROWS - 1)

  for (let rowIndex = previewStart; rowIndex <= endRow; rowIndex++) {
    previewRows.push((matrix[rowIndex] ?? []).slice(0, MAX_PREVIEW_COLUMNS))
    previewRowIndices.push(rowIndex)
  }

  return { previewRows, previewRowIndices }
}

export function analyzeWorksheetForSelection(sheet: WorkSheet): PendingExcelSelection & { preview: ExcelSelectionPreview } {
  const matrix = buildWorksheetMatrix(sheet)
  validateMatrixBounds(matrix)

  const firstNonEmptyRow = findFirstNonEmptyRow(matrix)
  const lastNonEmptyRow = findLastNonEmptyRow(matrix)

  if (firstNonEmptyRow === -1 || lastNonEmptyRow === -1) {
    throw new ExcelParseError('NO_VISIBLE_DATA', 'Excel sayfasında görünür veri bulunamadı.')
  }

  let suggestedHeaderRowIndex = firstNonEmptyRow
  let hasReliableHeaderSuggestion = true

  try {
    suggestedHeaderRowIndex = detectSuggestedHeaderRow(matrix, firstNonEmptyRow, lastNonEmptyRow)
  } catch (error) {
    if (error instanceof ExcelParseError && error.code === 'HEADER_NOT_FOUND') {
      hasReliableHeaderSuggestion = false
      suggestedHeaderRowIndex = firstNonEmptyRow
    } else {
      throw error
    }
  }

  const { previewRows, previewRowIndices } = buildPreviewRows(
    matrix,
    firstNonEmptyRow,
    lastNonEmptyRow,
    suggestedHeaderRowIndex,
  )

  return {
    matrix,
    firstNonEmptyRow,
    lastNonEmptyRow,
    suggestedHeaderRowIndex,
    preview: {
      previewRows,
      previewRowIndices,
      firstNonEmptyRow,
      lastNonEmptyRow,
      suggestedHeaderRowIndex,
      hasReliableHeaderSuggestion,
    },
  }
}

export function finalizeExcelSelection(
  selection: PendingExcelSelection,
  headerRowIndex: number | null,
  dataStartRowIndex: number,
): ParsedExcelResult {
  const { matrix, firstNonEmptyRow, lastNonEmptyRow } = selection
  const mode: ExcelSelectionMode = headerRowIndex !== null ? 'header-row' : 'no-header'

  if (dataStartRowIndex < firstNonEmptyRow || dataStartRowIndex > lastNonEmptyRow) {
    throw new ExcelParseError('HEADER_NOT_FOUND', 'Seçilen veri başlangıç satırı geçerli veri aralığının dışında.')
  }

  if (headerRowIndex !== null && (headerRowIndex < firstNonEmptyRow || headerRowIndex > lastNonEmptyRow)) {
    throw new ExcelParseError('HEADER_NOT_FOUND', 'Seçilen başlık satırı geçerli veri aralığının dışında.')
  }

  if (headerRowIndex !== null && dataStartRowIndex <= headerRowIndex) {
    throw new ExcelParseError('NO_DATA_ROWS_AFTER_HEADER', 'Veri başlangıcı başlık satırından sonra olmalıdır.')
  }

  const activeColumnIndices = buildActiveColumnIndices(matrix, dataStartRowIndex, lastNonEmptyRow)
  if (activeColumnIndices.length === 0) {
    throw new ExcelParseError('NO_VISIBLE_DATA', 'Excel tablosunda kullanılabilir sütun bulunamadı.')
  }

  const headerWarnings: ParsedExcelWarning[] = []
  const columns = headerRowIndex !== null
    ? (() => {
      const { columns: sanitized, warnings } = sanitizeHeaders(matrix[headerRowIndex] ?? [], activeColumnIndices)
      headerWarnings.push(...warnings)
      return sanitized
    })()
    : buildSyntheticHeaders(activeColumnIndices)

  const { rows, emptyRowsRemoved } = buildRowObjects(
    matrix,
    columns,
    activeColumnIndices,
    dataStartRowIndex,
    lastNonEmptyRow,
  )

  if (rows.length === 0) {
    throw new ExcelParseError('NO_DATA_ROWS_AFTER_HEADER', 'Seçilen satırdan sonra kullanılabilir veri bulunamadı.')
  }

  const maxColumnCount = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  const stats: ParsedExcelStats = {
    mode,
    headerRowIndex: headerRowIndex ?? -1,
    dataStartRowIndex,
    leadingEmptyRowsSkipped: firstNonEmptyRow,
    titleRowsSkipped: headerRowIndex !== null ? Math.max(0, headerRowIndex - firstNonEmptyRow) : 0,
    emptyRowsRemoved,
    emptyColumnsRemoved: Math.max(0, maxColumnCount - activeColumnIndices.length),
    sourceRowCount: Math.max(0, lastNonEmptyRow - firstNonEmptyRow + 1),
    outputRowCount: rows.length,
  }

  return {
    rows,
    columns,
    preview: rows.slice(0, 3),
    warnings: [...buildWarnings(stats), ...headerWarnings],
    stats,
  }
}

export function parseWorksheetToTable(sheet: WorkSheet): ParsedExcelResult {
  const selection = analyzeWorksheetForSelection(sheet)
  if (!selection.preview.hasReliableHeaderSuggestion) {
    throw new ExcelParseError('HEADER_NOT_FOUND', 'Excel içinde güvenilir bir başlık satırı bulunamadı.')
  }
  return finalizeExcelSelection(
    selection,
    selection.suggestedHeaderRowIndex,
    selection.suggestedHeaderRowIndex + 1,
  )
}

export function analyzeExcelArrayBuffer(buffer: ArrayBuffer): PendingExcelSelection & { preview: ExcelSelectionPreview } {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) {
    throw new ExcelParseError('EMPTY_WORKBOOK', 'Excel çalışma kitabında sayfa bulunamadı.')
  }

  const worksheet = workbook.Sheets[firstSheetName]
  if (!worksheet) {
    throw new ExcelParseError('EMPTY_SHEET', 'İlk Excel sayfası okunamadı.')
  }

  return analyzeWorksheetForSelection(worksheet)
}

export function parseExcelArrayBuffer(buffer: ArrayBuffer): ParsedExcelResult {
  const selection = analyzeExcelArrayBuffer(buffer)
  return finalizeExcelSelection(
    selection,
    selection.suggestedHeaderRowIndex,
    selection.suggestedHeaderRowIndex + 1,
  )
}
