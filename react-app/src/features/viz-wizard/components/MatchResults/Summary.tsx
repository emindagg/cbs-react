/**
 * Match Results Summary Component
 * Displays match statistics and action buttons
 */

import type { MatchResults } from '@/types/visualization'

interface SummaryProps {
  matchResults: MatchResults
}

export function Summary({ matchResults }: SummaryProps) {
  return (
    <div className="bg-white border border-zinc-100 rounded-md p-2.5 shadow-xs">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
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
    </div>
  )
}
