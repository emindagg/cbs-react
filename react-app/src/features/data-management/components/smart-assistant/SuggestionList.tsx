import { SuggestionItem } from './SuggestionItem'
import type { VideoEntry } from './types'

export interface DisplayedSuggestion {
  entry: VideoEntry
  matchedTokens: string[]
}

interface SuggestionListProps {
  items: DisplayedSuggestion[]
  activeIndex: number
  listboxId: string
  optionIdPrefix: string
  query: string
  onSelect: (entry: VideoEntry) => void
  onActiveIndexChange: (i: number) => void
  onOpenLibrary: () => void
}

export function SuggestionList({
  items,
  activeIndex,
  listboxId,
  optionIdPrefix,
  query,
  onSelect,
  onActiveIndexChange,
  onOpenLibrary,
}: SuggestionListProps) {
  if (items.length === 0) {
    return (
      <ul id={listboxId} role="listbox" className="relative mt-2 space-y-0.5">
        <li className="px-2 py-3 text-center" role="status">
          <span className="block text-[11px] text-zinc-600">
            &quot;{query}&quot; için sonuç yok.
          </span>
          <button
            type="button"
            onClick={onOpenLibrary}
            className="mt-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
          >
            Tüm rehbere göz at →
          </button>
        </li>
      </ul>
    )
  }

  return (
    <ul id={listboxId} role="listbox" className="relative mt-2 space-y-0.5">
      {items.map((s, i) => (
        <SuggestionItem
          key={s.entry.id}
          entry={s.entry}
          matchedTokens={s.matchedTokens}
          active={i === activeIndex}
          optionId={`${optionIdPrefix}-${i}`}
          onSelect={() => onSelect(s.entry)}
          onMouseEnter={() => onActiveIndexChange(i)}
        />
      ))}
    </ul>
  )
}
