import { normalizeTurkishText } from '@/utils/turkishNormalizer'

import type { VideoEntry } from './types'

interface SuggestionItemProps {
  entry: VideoEntry
  matchedTokens: string[]
  active: boolean
  optionId: string
  onSelect: () => void
  onMouseEnter: () => void
}

/**
 * Eşleşen token'ı başlık içinde <mark> ile vurgular.
 * Türkçe karakterleri görsel olarak korur — eşleşmeyi normalize edilmiş forma göre yapar.
 */
function highlightTitle(title: string, tokens: string[]): React.ReactNode {
  if (tokens.length === 0) return title
  const titleNorm = normalizeTurkishText(title, true)
  // Her karakterin orijinal index'i ile normalize edilmiş index'i 1-1 örtüşmüyor olabilir
  // (NFD bazı karakterleri parçalıyor). Pratikte çoğu Türkçe harf 1-1'dir; basit yaklaşım yeterli.
  const result: Array<{ ch: string; matched: boolean }> = title.split('').map((ch) => ({ ch, matched: false }))

  for (const t of tokens) {
    if (!t) continue
    let from = 0
    while (true) {
      const idx = titleNorm.indexOf(t, from)
      if (idx === -1) break
      for (let i = idx; i < idx + t.length && i < result.length; i++) {
        result[i].matched = true
      }
      from = idx + t.length
    }
  }

  const out: React.ReactNode[] = []
  let i = 0
  while (i < result.length) {
    const matched = result[i].matched
    let j = i
    while (j < result.length && result[j].matched === matched) j++
    const slice = result.slice(i, j).map((c) => c.ch).join('')
    out.push(matched
      ? <mark key={i} className="bg-emerald-200/60 text-emerald-900 rounded px-0.5">{slice}</mark>
      : <span key={i}>{slice}</span>)
    i = j
  }
  return out
}

export function SuggestionItem({
  entry,
  matchedTokens,
  active,
  optionId,
  onSelect,
  onMouseEnter,
}: SuggestionItemProps) {
  return (
    <li>
      <button
        type="button"
        id={optionId}
        role="option"
        aria-selected={active}
        onClick={onSelect}
        onMouseEnter={onMouseEnter}
        className={`group/item flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
          active ? 'bg-emerald-50' : 'hover:bg-emerald-50/80'
        }`}
        title={`"${entry.title}" videosunu oynat (${entry.duration})`}
      >
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300/40 tabular-nums">
          {entry.num}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-[12px] font-medium text-zinc-900">
            {highlightTitle(entry.title, matchedTokens)}
          </span>
          <span className="block truncate text-[10px] text-zinc-500">
            {entry.hint}
          </span>
        </span>
        <span className="text-[9px] tabular-nums text-zinc-400 shrink-0">{entry.duration}</span>
        <i
          className={`fa-solid fa-arrow-right text-[10px] transition-all ${
            active ? 'text-emerald-600 translate-x-0.5' : 'text-zinc-300 group-hover/item:translate-x-0.5 group-hover/item:text-emerald-600'
          }`}
          aria-hidden
        />
      </button>
    </li>
  )
}
