/**
 * ExcelHeaderPanel
 * Excel başlık satırı ve veri başlangıcı seçimi — DataMapper modal içinde gösterilir.
 */

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { detectColumns } from '@/utils/columnMapper/columnDetector'
import { finalizeExcelSelection } from '@/utils/columnMapper/excelParser'
import type { PendingExcelWorkbook } from '@/utils/columnMapper/types'

interface ExcelHeaderPanelProps {
  pending: PendingExcelWorkbook
}

export function ExcelHeaderPanel({ pending }: ExcelHeaderPanelProps) {
  const { setFileData, setColumnMapping, setPendingExcel, setPendingExcelActiveSheet } = useVisualizationStore()

  const activeSheet = pending.sheets[pending.activeSheetIndex]
  const sheetSelection = activeSheet?.selection ?? null
  const sheetPreview = sheetSelection?.preview ?? null

  const suggested = sheetPreview?.suggestedHeaderRowIndex ?? 0
  const [headerRowIndex, setHeaderRowIndex] = useState<number | null>(suggested)
  const [dataStartRowIndex, setDataStartRowIndex] = useState(
    sheetPreview && suggested + 1 <= sheetPreview.lastNonEmptyRow ? suggested + 1 : suggested,
  )
  const [isLoading, setIsLoading] = useState(false)

  // Reset header/data-start picks whenever the active sheet changes
  useEffect(() => {
    if (!sheetPreview) return
    setHeaderRowIndex(sheetPreview.suggestedHeaderRowIndex)
    setDataStartRowIndex(
      sheetPreview.suggestedHeaderRowIndex + 1 <= sheetPreview.lastNonEmptyRow
        ? sheetPreview.suggestedHeaderRowIndex + 1
        : sheetPreview.suggestedHeaderRowIndex,
    )
  }, [pending.activeSheetIndex, sheetPreview])

  const hasHeader = headerRowIndex !== null
  const isValid = sheetPreview !== null && (headerRowIndex === null || dataStartRowIndex > headerRowIndex)
  const maxCols = sheetPreview ? Math.max(...sheetPreview.previewRows.map((r) => r.length), 0) : 0
  const showSheetPicker = pending.sheets.length > 1

  const handleHeaderRowChange = (rowIndex: number | null) => {
    if (rowIndex === null) {
      setHeaderRowIndex(null)
    } else {
      if (sheetPreview && dataStartRowIndex <= rowIndex) {
        setDataStartRowIndex(Math.min(rowIndex + 1, sheetPreview.lastNonEmptyRow))
      }
      setHeaderRowIndex(rowIndex)
    }
  }

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingExcelActiveSheet(Number(e.target.value))
  }

  const handleConfirm = () => {
    if (!sheetSelection) return
    setIsLoading(true)
    try {
      const result = finalizeExcelSelection(sheetSelection, headerRowIndex, dataStartRowIndex)
      setFileData(result.rows, result.columns)

      const suggestions = detectColumns(result.rows, result.columns)
      if (suggestions) {
        setColumnMapping({
          locationColumn: suggestions.locationColumn,
          districtColumn: suggestions.districtColumn,
          dataColumn: suggestions.dataColumn,
          locationLevel: suggestions.locationLevel as 'province' | 'district' | 'mixed',
        })
      }

      setPendingExcel(null)

      const warnMessages = result.warnings.map((w) => w.message).join(' ')
      if (warnMessages) toast(warnMessages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Excel okunamadı')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <div className="flex flex-1 items-center gap-4">
          <div>
            <p className="text-[11px] text-zinc-500">
              {showSheetPicker
                ? 'Sayfayı, başlık satırını ve verinin hangi satırdan başladığını seçin.'
                : 'Başlık satırını ve verinin hangi satırdan başladığını seçin.'}
            </p>
          </div>
          {showSheetPicker && (
            <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-600">
              <span>Sayfa:</span>
              <select
                value={pending.activeSheetIndex}
                onChange={handleSheetChange}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 focus:border-emerald-500 focus:outline-none"
              >
                {pending.sheets.map((sheet, idx) => (
                  <option key={idx} value={idx} disabled={!sheet.selection}>
                    {sheet.name}
                    {sheet.selection
                      ? ` (~${sheet.estimatedDataRows} satır)`
                      : ' (boş)'}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <label className="flex shrink-0 cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={!hasHeader}
            onChange={(e) =>
              handleHeaderRowChange(e.target.checked ? null : (sheetPreview?.suggestedHeaderRowIndex ?? 0))
            }
            className="h-3.5 w-3.5"
            disabled={!sheetPreview}
          />
          <span className="text-[11px] font-medium text-zinc-600">Başlık yok</span>
        </label>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {!sheetPreview ? (
          <div className="flex h-full items-center justify-center p-8 text-[12px] text-zinc-500">
            {activeSheet?.error ?? 'Bu sayfa kullanılamıyor.'}
          </div>
        ) : (
          <table className="min-w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-zinc-50 z-10">
              <tr>
                <th className="w-10 border-b border-r border-zinc-200 px-3 py-2 text-center font-medium text-zinc-400">
                  #
                </th>
                <th className="w-20 border-b border-r border-zinc-200 px-3 py-2 text-center font-semibold text-blue-600">
                  Başlık
                </th>
                <th className="w-24 border-b border-r border-zinc-200 px-3 py-2 text-center font-semibold text-emerald-600">
                  Veri Başlangıcı
                </th>
                {Array.from({ length: maxCols }).map((_, i) => (
                  <th key={i} className="border-b border-zinc-200 px-3 py-2 text-left font-medium text-zinc-500">
                    {/* eslint-disable-next-line no-magic-numbers */}
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetPreview.previewRows.map((row, rowOffset) => {
                const rowIndex = sheetPreview.previewRowIndices[rowOffset]
                const isHeader = rowIndex === headerRowIndex
                const isDataStart = rowIndex === dataStartRowIndex
                const isSuggested = rowIndex === sheetPreview.suggestedHeaderRowIndex

                let rowBg = 'bg-white hover:bg-zinc-50/60'
                if (isHeader && isDataStart) rowBg = 'bg-amber-50'
                else if (isHeader) rowBg = 'bg-blue-50'
                else if (isDataStart) rowBg = 'bg-emerald-50'

                return (
                  <tr key={rowIndex} className={`transition-colors ${rowBg}`}>
                    <td className="border-b border-r border-zinc-100 px-3 py-2 text-center font-medium text-zinc-400">
                      {rowIndex + 1}
                      {isSuggested && !isHeader && (
                        <div className="text-[9px] leading-none text-amber-500">öneri</div>
                      )}
                    </td>
                    <td className="border-b border-r border-zinc-100 px-3 py-2 text-center">
                      {hasHeader ? (
                        <input
                          type="radio"
                          name="excel-header-row"
                          checked={isHeader}
                          onChange={() => handleHeaderRowChange(rowIndex)}
                          aria-label={`Başlık satırı ${rowIndex + 1}`}
                        />
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="border-b border-r border-zinc-100 px-3 py-2 text-center">
                      <input
                        type="radio"
                        name="excel-data-start-row"
                        checked={isDataStart}
                        onChange={() => setDataStartRowIndex(rowIndex)}
                        aria-label={`Veri başlangıcı ${rowIndex + 1}`}
                      />
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={`max-w-[200px] border-b border-zinc-100 px-3 py-2 ${
                          isHeader ? 'font-semibold text-blue-800' : 'text-zinc-700'
                        }`}
                      >
                        <span className="block truncate">
                          {cell || <span className="text-zinc-300">boş</span>}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-4 border-t border-zinc-100 bg-[#fafbfc] px-5 py-3">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          {!isValid ? (
            <span className="font-medium text-red-500">
              Veri başlangıcı başlık satırından sonra olmalıdır.
            </span>
          ) : hasHeader ? (
            <>
              Satır <strong className="text-blue-700">{headerRowIndex! + 1}</strong> başlık
              {' · '}
              Satır <strong className="text-emerald-700">{dataStartRowIndex + 1}</strong>'den itibaren veri okunacak.
            </>
          ) : (
            <>
              Satır <strong className="text-emerald-700">{dataStartRowIndex + 1}</strong>'den itibaren veri
              okunacak · Sütun adları otomatik oluşturulacak.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid || isLoading}
          className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? 'Yükleniyor…' : 'Devam Et'}
        </button>
      </div>
    </div>
  )
}
