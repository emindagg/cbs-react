import { EXPORT_FORMATS } from '../constants/formats'
import type { ExportFormat } from '../types'

interface ExportControlsProps {
  exportFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  onExport: () => void;
}

/**
 * Export controls component
 */
export function ExportControls({ exportFormat, onFormatChange, onExport }: ExportControlsProps) {
  return (
    <>
      <div className="mb-3">
        <label className="block text-xs font-medium text-zinc-700 mb-1">
          Dışa Aktarma Formatı
        </label>
        <div className="relative">
          <select
            value={exportFormat}
            onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
            className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
          >
            {EXPORT_FORMATS.map(format => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-zinc-500">
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </div>
        </div>
      </div>

      <button
        onClick={onExport}
        className="w-full bg-zinc-900 hover:bg-black text-white font-medium py-2 px-3 rounded-lg transition-all flex items-center justify-center hover:scale-[1.02] active:scale-95 shadow-xs mb-2"
      >
        <i className="fa-solid fa-download mr-2"></i>Projeyi İndir
      </button>
    </>
  )
}
