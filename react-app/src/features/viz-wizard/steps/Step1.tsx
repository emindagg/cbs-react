/**
 * Wizard Step 1: File Upload
 * Upload Excel/CSV file
 */

import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { ColumnMapper } from '@/utils/columnMapper'
import type {
  ExcelSelectionMode,
  ExcelSelectionPreview,
  FileInfo,
} from '@/utils/columnMapper/types'

interface VizWizardStep1Props {
  onNext: () => void;
}

interface PendingExcelSelectionState {
  preview: ExcelSelectionPreview
  mode: ExcelSelectionMode
  selectedRowIndex: number
}

function buildWarningSummary(fileInfo: FileInfo): string | null {
  const warnings = fileInfo.warnings ?? []
  const stats = fileInfo.stats

  if (!stats) return null

  const parts: string[] = []
  if (stats.mode === 'no-header') {
    parts.push('başlık kullanılmadı')
  }
  if (stats.leadingEmptyRowsSkipped > 0) {
    parts.push(`${stats.leadingEmptyRowsSkipped} boş üst satır`)
  }
  if (stats.titleRowsSkipped > 0) {
    parts.push(`${stats.titleRowsSkipped} üst satır`)
  }
  if (stats.emptyColumnsRemoved > 0) {
    parts.push(`${stats.emptyColumnsRemoved} boş sütun`)
  }
  if (stats.emptyRowsRemoved > 0) {
    parts.push(`${stats.emptyRowsRemoved} boş veri satırı`)
  }

  if (!parts.length) {
    return warnings.length > 0 ? `${warnings.length} temizlik uyarısı uygulandı.` : null
  }

  return `Excel temizlendi: ${parts.join(', ')}.`
}

function PreviewTable({
  pending,
  onModeChange,
  onRowSelect,
  onConfirm,
}: {
  pending: PendingExcelSelectionState
  onModeChange: (mode: ExcelSelectionMode) => void
  onRowSelect: (rowIndex: number) => void
  onConfirm: () => void
}) {
  const selectionLabel = pending.mode === 'header-row' ? 'Başlık' : 'Veri başlangıcı'

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-800">Excel Önizleme</h4>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              {pending.preview.hasReliableHeaderSuggestion
                ? `Önerilen başlık satırı: ${pending.preview.suggestedHeaderRowIndex + 1}`
                : 'Başlık satırı otomatik olarak güvenle belirlenemedi. Satırı siz seçin.'}
            </p>
          </div>
          <div className="flex rounded-md border border-zinc-200 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => onModeChange('header-row')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                pending.mode === 'header-row'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Başlık var
            </button>
            <button
              type="button"
              onClick={() => onModeChange('no-header')}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                pending.mode === 'no-header'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              Başlık yok
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[10px]">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="border-b border-r border-zinc-100 px-2 py-2 text-left font-medium">Seç</th>
              <th className="border-b border-r border-zinc-100 px-2 py-2 text-left font-medium">Satır</th>
              {Array.from({ length: Math.max(...pending.preview.previewRows.map((row) => row.length), 0) }).map((_, index) => (
                <th key={index} className="border-b border-zinc-100 px-2 py-2 text-left font-medium">
                  {String.fromCharCode(65 + index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.preview.previewRows.map((row, rowOffset) => {
              const rowIndex = pending.preview.previewRowIndices[rowOffset]
              const isSelected = rowIndex === pending.selectedRowIndex
              const isSuggested = rowIndex === pending.preview.suggestedHeaderRowIndex
              return (
                <tr
                  key={rowIndex}
                  className={isSelected ? 'bg-emerald-50/70' : isSuggested ? 'bg-amber-50/60' : 'bg-white'}
                >
                  <td className="border-b border-r border-zinc-100 px-2 py-1.5">
                    <input
                      type="radio"
                      name="excel-row-selection"
                      checked={isSelected}
                      onChange={() => onRowSelect(rowIndex)}
                      aria-label={`${selectionLabel} satırı ${rowIndex + 1}`}
                    />
                  </td>
                  <td className="border-b border-r border-zinc-100 px-2 py-1.5 font-medium text-zinc-600">
                    {rowIndex + 1}
                    {isSuggested && (
                      <span className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700">
                        Öneri
                      </span>
                    )}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="max-w-40 border-b border-zinc-100 px-2 py-1.5 text-zinc-700">
                      <span className="block truncate">{cell || <span className="text-zinc-300">boş</span>}</span>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2">
        <p className="text-[10px] text-zinc-500">
          {pending.mode === 'header-row'
            ? 'Seçilen satır başlık kabul edilir, altındaki satırlar veri olur.'
            : 'Seçilen satırdan itibaren veri okunur, sütun adları otomatik üretilir.'}
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700"
        >
          {pending.mode === 'header-row' ? 'Başlığı Onayla' : 'Veri Başlangıcını Onayla'}
        </button>
      </div>
    </div>
  )
}

export default function VizWizardStep1({ onNext }: VizWizardStep1Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [pendingExcel, setPendingExcel] = useState<PendingExcelSelectionState | null>(null)
  const mapperRef = useRef<ColumnMapper | null>(null)

  const { setFileData, setColumnMapping } = useVisualizationStore()

  const applyParsedData = (mapper: ColumnMapper, info: FileInfo) => {
    setFileData(mapper.rawData || [], mapper.columns)

    const suggestions = mapper.detectColumns()
    if (suggestions) {
      setColumnMapping({
        locationColumn: suggestions.locationColumn,
        districtColumn: suggestions.districtColumn,
        dataColumn: suggestions.dataColumn,
        locationLevel: suggestions.locationLevel as 'province' | 'district' | 'mixed',
      })
    }

    setFileInfo(info)
    setPendingExcel(null)

    const warningSummary = buildWarningSummary(info)
    if (warningSummary) {
      toast(warningSummary)
    }

    setTimeout(() => {
      onNext()
    }, 500)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)
    setFileInfo(null)
    setPendingExcel(null)

    try {
      const mapper = new ColumnMapper()
      mapperRef.current = mapper
      const result = await mapper.loadFile(file)

      if (result.kind === 'ready') {
        applyParsedData(mapper, result.fileInfo)
      } else {
        setPendingExcel({
          preview: result.preview,
          mode: 'header-row',
          selectedRowIndex: result.preview.suggestedHeaderRowIndex,
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Dosya yüklenemedi: ' + message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeChange = (mode: ExcelSelectionMode) => {
    setPendingExcel((current) => {
      if (!current) return current
      return {
        ...current,
        mode,
        selectedRowIndex: mode === 'header-row'
          ? current.preview.suggestedHeaderRowIndex
          : current.preview.firstNonEmptyRow,
      }
    })
  }

  const handleExcelConfirm = async () => {
    if (!mapperRef.current || !pendingExcel) return

    setIsLoading(true)
    try {
      const result = mapperRef.current.finalizeExcelSelection(pendingExcel.mode, pendingExcel.selectedRowIndex)
      applyParsedData(mapperRef.current, result)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Excel seçim hatası: ' + message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex">
          <label className="shrink-0 px-4 py-2 bg-zinc-800 text-white text-[11px] font-medium cursor-pointer hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            Dosya Aç
          </label>

          <div className="flex-1 px-3 py-2 bg-white text-[11px] text-zinc-500 flex items-center">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mr-2"></div>
                Yükleniyor...
              </>
            ) : fileName ? (
              <span className="text-zinc-700 truncate">{fileName}</span>
            ) : (
              'Dosya seçilmedi'
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400">
        Excel (.xlsx, .xls) veya CSV (.csv)
      </p>

      {pendingExcel && !isLoading && (
        <PreviewTable
          pending={pendingExcel}
          onModeChange={handleModeChange}
          onRowSelect={(rowIndex) => setPendingExcel((current) => current ? { ...current, selectedRowIndex: rowIndex } : current)}
          onConfirm={handleExcelConfirm}
        />
      )}

      {!isLoading && fileInfo && fileName && (
        <div className="bg-emerald-50/50 rounded-md p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
            <p className="text-[11px] font-semibold text-emerald-900 truncate">{fileName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-emerald-700">
            <span><i className="fa-solid fa-table-rows mr-1"></i>{fileInfo.rowCount} satır</span>
            <span><i className="fa-solid fa-table-columns mr-1"></i>{fileInfo.columns.length} sütun</span>
            {fileInfo.stats && fileInfo.stats.mode === 'header-row' && fileInfo.stats.headerRowIndex >= 0 && (
              <span><i className="fa-solid fa-heading mr-1"></i>Başlık: {fileInfo.stats.headerRowIndex + 1}. satır</span>
            )}
            {fileInfo.stats?.mode === 'no-header' && (
              <span><i className="fa-solid fa-list mr-1"></i>Başlıksız veri modu</span>
            )}
          </div>
          {!!fileInfo.warnings?.length && (
            <p className="mt-1.5 text-[10px] text-amber-700">
              {fileInfo.warnings.length} temizlik uyarısı uygulandı.
            </p>
          )}
        </div>
      )}

      {!fileName && !isLoading && (
        <div className="flex items-start gap-2 p-2 bg-zinc-50/50 rounded-md">
          <i className="fa-solid fa-lightbulb text-amber-500 text-xs mt-0.5"></i>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Türkiye il veya ilçe verisi içeren Excel/CSV dosyası yükleyin.
          </p>
        </div>
      )}
    </div>
  )
}
