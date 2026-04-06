/**
 * Wizard Step 1: File Upload
 * Upload Excel/CSV file
 */

import { useState } from 'react'
import toast from 'react-hot-toast'

import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { ColumnMapper } from '@/utils/columnMapper'
import type { FileInfo } from '@/utils/columnMapper/types'

interface VizWizardStep1Props {
  onNext: () => void;
}

function buildWarningSummary(fileInfo: FileInfo): string | null {
  const warnings = fileInfo.warnings ?? []
  const stats = fileInfo.stats

  if (!stats) return null

  const parts: string[] = []
  if (stats.mode === 'no-header') parts.push('başlık kullanılmadı')
  if (stats.leadingEmptyRowsSkipped > 0) parts.push(`${stats.leadingEmptyRowsSkipped} boş üst satır`)
  if (stats.titleRowsSkipped > 0) parts.push(`${stats.titleRowsSkipped} üst satır`)
  if (stats.emptyColumnsRemoved > 0) parts.push(`${stats.emptyColumnsRemoved} boş sütun`)
  if (stats.emptyRowsRemoved > 0) parts.push(`${stats.emptyRowsRemoved} boş veri satırı`)

  if (!parts.length) {
    return warnings.length > 0 ? `${warnings.length} temizlik uyarısı uygulandı.` : null
  }

  return `Excel temizlendi: ${parts.join(', ')}.`
}

export default function VizWizardStep1({ onNext }: VizWizardStep1Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  const { setFileData, setColumnMapping, setPendingExcel } = useVisualizationStore()

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
    const warningSummary = buildWarningSummary(info)
    if (warningSummary) toast(warningSummary)

    setTimeout(() => onNext(), 500)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setFileName(file.name)
    setFileInfo(null)

    try {
      const mapper = new ColumnMapper()
      const result = await mapper.loadFile(file)

      if (result.kind === 'ready') {
        applyParsedData(mapper, result.fileInfo)
      } else {
        setPendingExcel(result.pending)
        onNext()
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error('Dosya yüklenemedi: ' + message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex">
          <label className="shrink-0 px-4 py-2 bg-zinc-800 text-white text-[11px] font-medium cursor-pointer hover:bg-zinc-700 transition-colors">
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
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mr-2" />
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

      <p className="text-[10px] text-zinc-400">Excel (.xlsx, .xls) veya CSV (.csv)</p>

      {!isLoading && fileInfo && fileName && (
        <div className="bg-emerald-50/50 rounded-md p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm" />
            <p className="text-[11px] font-semibold text-emerald-900 truncate">{fileName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-emerald-700">
            <span><i className="fa-solid fa-table-rows mr-1" />{fileInfo.rowCount} satır</span>
            <span><i className="fa-solid fa-table-columns mr-1" />{fileInfo.columns.length} sütun</span>
          </div>
        </div>
      )}

      {!fileName && !isLoading && (
        <div className="flex items-start gap-2 p-2 bg-zinc-50/50 rounded-md">
          <i className="fa-solid fa-lightbulb text-amber-500 text-xs mt-0.5" />
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Türkiye il veya ilçe verisi içeren Excel/CSV dosyası yükleyin.
          </p>
        </div>
      )}
    </div>
  )
}
