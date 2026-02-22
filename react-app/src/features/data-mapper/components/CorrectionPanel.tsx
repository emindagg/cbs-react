import { useMemo } from 'react'

import type { UnmatchedGroup } from '@/utils/fuzzyMatch'
import { groupUnmatchedValues } from '@/utils/fuzzyMatch'
import { normalizeTurkishText } from '@/utils/turkishNormalizer'

interface CorrectionPanelProps {
  rawData: Record<string, unknown>[] | null
  locationColumn: string
  geoJsonKeys: string[]
  matchedKeys: Set<string>
  onApplyCorrection: (originalValue: string, newValue: string, rowIndices: number[]) => void
  onApplyAll: (corrections: Array<{ original: string; suggestion: string; rowIndices: number[] }>) => void
}

export function CorrectionPanel({
  rawData,
  locationColumn,
  geoJsonKeys,
  matchedKeys,
  onApplyCorrection,
  onApplyAll,
}: CorrectionPanelProps) {
  const groups = useMemo<UnmatchedGroup[]>(() => {
    if (!rawData || !locationColumn || geoJsonKeys.length === 0) return []
    return groupUnmatchedValues(rawData, locationColumn, geoJsonKeys, matchedKeys, normalizeTurkishText)
  }, [rawData, locationColumn, geoJsonKeys, matchedKeys])

  const autoFixable = useMemo(
    () => groups.filter(g => g.suggestion && g.suggestion.similarity >= 0.6),
    [groups],
  )

  if (groups.length === 0) return null

  return (
    <div className="border border-amber-200 bg-amber-50/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-100/50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-spell-check text-amber-600 text-xs"></i>
          <span className="text-[11px] font-semibold text-amber-800">
            {groups.length} eşleşmeyen değer
          </span>
        </div>
        {autoFixable.length > 0 && (
          <button
            onClick={() => onApplyAll(
              autoFixable.map(g => ({
                original: g.originalValue,
                suggestion: g.suggestion!.value,
                rowIndices: g.rowIndices,
              })),
            )}
            className="text-[10px] font-semibold bg-amber-500 text-white px-2.5 py-1 rounded-md hover:bg-amber-600 active:scale-95"
          >
            Tümünü Düzelt ({autoFixable.length})
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-40 overflow-y-auto">
        {groups.map((group) => (
          <div
            key={group.originalValue}
            className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-100 last:border-b-0 text-[10px]"
          >
            <span className="text-red-600 font-medium truncate min-w-0 flex-shrink" title={group.originalValue}>
              {group.originalValue}
            </span>
            <span className="text-amber-400 flex-shrink-0">
              ({group.rowIndices.length})
            </span>
            {group.suggestion ? (
              <>
                <i className="fa-solid fa-arrow-right text-[8px] text-amber-400 flex-shrink-0"></i>
                <span className="text-emerald-700 font-medium truncate min-w-0 flex-shrink" title={group.suggestion.value}>
                  {group.suggestion.value}
                </span>
                <span className="text-zinc-400 flex-shrink-0">
                  ({Math.round(group.suggestion.similarity * 100)}%)
                </span>
                <button
                  onClick={() => onApplyCorrection(group.originalValue, group.suggestion!.value, group.rowIndices)}
                  className="ml-auto flex-shrink-0 text-[9px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded"
                >
                  Düzelt
                </button>
              </>
            ) : (
              <span className="text-zinc-400 italic ml-auto flex-shrink-0">Öneri yok</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
