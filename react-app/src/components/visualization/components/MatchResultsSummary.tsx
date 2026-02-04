/**
 * Match Results Summary Component
 * Displays match statistics and action buttons
 */

import type { MatchResults } from '../../../types/visualization'

interface MatchResultsSummaryProps {
  matchResults: MatchResults
  onShowDetails: () => void
}

export function MatchResultsSummary({ matchResults, onShowDetails }: MatchResultsSummaryProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-md p-2.5 shadow-xs">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">
            {matchResults.successful.length}
          </div>
          <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
            <i className="fa-solid fa-check"></i>
            Başarılı
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-amber-600">
            {matchResults.ambiguous.length}
          </div>
          <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
            <i className="fa-solid fa-triangle-exclamation"></i>
            Belirsiz
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">
            {matchResults.failed.length}
          </div>
          <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
            <i className="fa-solid fa-xmark"></i>
            Hatalı
          </div>
        </div>
      </div>

      {/* Detaylı Önizleme Button */}
      <button
        onClick={onShowDetails}
        className="w-full px-3 py-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <i className="fa-solid fa-table-list text-[9px]"></i>
        Detaylı Görüntüle
      </button>
    </div>
  )
}
