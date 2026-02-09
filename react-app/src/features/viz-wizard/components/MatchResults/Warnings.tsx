/**
 * Match Results Warnings Component
 * Displays warnings and info messages
 */

import type { MatchResults } from '@/types/visualization'

interface WarningsProps {
  matchResults: MatchResults
}

export function Warnings({ matchResults }: WarningsProps) {
  return (
    <div className="space-y-1.5">
      {matchResults.ambiguous.length > 0 && (
        <div className="bg-amber-50/50 rounded-sm p-1.5 flex items-start gap-1.5">
          <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[10px] mt-0.5"></i>
          <p className="text-[10px] text-amber-700 leading-relaxed">
            {matchResults.ambiguous.length} belirsiz eşleşme göz ardı edilecek
          </p>
        </div>
      )}

      {matchResults.failed.length > 0 && (
        <div className="bg-red-50/50 rounded-sm p-1.5 flex items-start gap-1.5">
          <i className="fa-solid fa-circle-xmark text-red-600 text-[10px] mt-0.5"></i>
          <p className="text-[10px] text-red-700 leading-relaxed">
            {matchResults.failed.length} hatalı kayıt göz ardı edilecek
          </p>
        </div>
      )}

      {matchResults.successful.length > 0 && (
        <div className="bg-emerald-50/50 rounded-sm p-1.5 flex items-start gap-1.5">
          <i className="fa-solid fa-circle-check text-emerald-600 text-[10px] mt-0.5"></i>
          <p className="text-[10px] text-emerald-700 leading-relaxed">
            {matchResults.successful.length} konum görselleştirmeye hazır
          </p>
        </div>
      )}
    </div>
  )
}
