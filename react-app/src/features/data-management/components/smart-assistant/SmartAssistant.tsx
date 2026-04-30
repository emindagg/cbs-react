import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { useVideoModalStore } from '@/stores/useVideoModalStore'

import { smartAssistantAnalytics as track } from './analytics'
import { SearchBar } from './SearchBar'
import { searchVideos } from './searchEngine'
import { SuggestionList, type DisplayedSuggestion } from './SuggestionList'
import type { VideoEntry } from './types'
import { useContextualDefaults } from './useContextualDefaults'
import { useVideoCatalog } from './useVideoCatalog'
import { useVoiceSearch } from './useVoiceSearch'

const FOCUS_DELAY_MS = 80
const SEARCH_TRACK_DEBOUNCE_MS = 600
const normalizeQueryForAnalytics = (value: string) => value.trim().toLowerCase()

export function SmartAssistant() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const reactId = useId()
  const popoverId = `${reactId}-popover`
  const comboboxId = `${reactId}-combobox`
  const listboxId = `${reactId}-listbox`
  const optionIdPrefix = `${reactId}-option`

  const catalog = useVideoCatalog()
  const defaults = useContextualDefaults(catalog)

  const handleQueryChange = (q: string) => {
    setQuery(q)
    setActiveIndex(0)
  }

  const { state: voiceState, isSupported: voiceSupported, start: startVoice } = useVoiceSearch({
    onTranscript: handleQueryChange,
  })

  // Sorgu sonuçları (boş sorguda bağlamsal defaultlar)
  const displayed = useMemo<DisplayedSuggestion[]>(() => {
    if (!query.trim()) {
      return defaults.map((entry) => ({ entry, matchedTokens: [] }))
    }
    return searchVideos(query, catalog).map((r) => ({
      entry: r.entry,
      matchedTokens: r.matchedTokens,
    }))
  }, [query, catalog, defaults])

  // No-result analytics — debounce'lu, sadece sorgu boş değilken
  useEffect(() => {
    if (!open || !query.trim()) return
    const t = setTimeout(() => {
      const normalizedQuery = normalizeQueryForAnalytics(query)
      track.search(normalizedQuery)
      if (displayed.length === 0) track.noResult(normalizedQuery)
    }, SEARCH_TRACK_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, displayed.length, open])

  // Dış tıklama ile kapat
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Açılınca arama input'una odaklan
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY_MS)
    return () => clearTimeout(t)
  }, [open])

  const openLibrary = () => {
    setOpen(false)
    track.openLibrary()
    useVideoModalStore.getState().open()
  }

  const playEntry = (entry: VideoEntry) => {
    setOpen(false)
    track.videoPlay(entry.id, query)
    useVideoModalStore.getState().open(entry.id)
  }

  const togglePanel = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) track.open()
      else track.close()
      return next
    })
  }

  const handleVoiceClick = () => {
    track.voiceUsed()
    startVoice()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (displayed.length === 0) return
      setActiveIndex((i) => (i + 1) % displayed.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (displayed.length === 0) return
      setActiveIndex((i) => (i - 1 + displayed.length) % displayed.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = displayed[activeIndex]?.entry
      if (selected) playEntry(selected)
      else if (query.trim()) openLibrary()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(Math.max(0, displayed.length - 1))
    }
  }

  const activeOptionId = displayed.length > 0 && activeIndex >= 0 && activeIndex < displayed.length
    ? `${optionIdPrefix}-${activeIndex}`
    : undefined

  return (
    <div ref={containerRef} className="relative mt-3">
      <button
        type="button"
        onClick={togglePanel}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white/40 px-4 py-2 backdrop-blur-md ring-1 ring-inset ring-zinc-900/10 transition-[background-color,box-shadow,transform] duration-300 hover:bg-white/70 hover:ring-emerald-400/40 hover:shadow-[0_8px_24px_-6px_rgba(16,185,129,0.35)] active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        title="Nasıl Kullanılır?"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_25%_40%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.14),transparent_55%)] opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        />
        <svg
          viewBox="0 0 24 24"
          className="relative h-4 w-4 shrink-0 transition-transform duration-[900ms] ease-out group-hover:rotate-[180deg]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${reactId}-spark`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <path d="M12 2.5L13.4 9.1L20 10.5L13.4 11.9L12 18.5L10.6 11.9L4 10.5L10.6 9.1Z" fill={`url(#${reactId}-spark)`} />
          <path d="M19.2 3.4L19.6 5.2L21.4 5.6L19.6 6L19.2 7.8L18.8 6L17 5.6L18.8 5.2Z" fill={`url(#${reactId}-spark)`} opacity="0.85" />
          <path d="M5.2 15.5L5.5 16.8L6.8 17.1L5.5 17.4L5.2 18.7L4.9 17.4L3.6 17.1L4.9 16.8Z" fill={`url(#${reactId}-spark)`} opacity="0.7" />
        </svg>
        <span className="relative text-[12px] font-medium tracking-wide text-zinc-800">
          Nasıl Kullanılır?
        </span>
        <svg
          viewBox="0 0 12 12"
          className={`relative h-2.5 w-2.5 shrink-0 fill-zinc-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Nasıl Kullanılır? — Eğitim Videoları"
          className="absolute bottom-full left-0 right-0 z-30 mb-2 rounded-2xl border border-white/60 bg-white/75 p-2.5 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.10),transparent_55%)]"
          />

          <SearchBar
            ref={inputRef}
            query={query}
            onQueryChange={handleQueryChange}
            onVoiceClick={handleVoiceClick}
            voiceState={voiceState}
            voiceSupported={voiceSupported}
            onKeyDown={handleInputKeyDown}
            comboboxId={comboboxId}
            listboxId={listboxId}
            activeOptionId={activeOptionId}
            expanded={displayed.length > 0}
          />

          {/* Screen reader sonuç sayısı duyurusu */}
          <span className="sr-only" aria-live="polite">
            {query.trim()
              ? displayed.length === 0
                ? 'Sonuç bulunamadı'
                : `${displayed.length} sonuç bulundu`
              : ''}
          </span>

          <SuggestionList
            items={displayed}
            activeIndex={activeIndex}
            listboxId={listboxId}
            optionIdPrefix={optionIdPrefix}
            query={query}
            onSelect={playEntry}
            onActiveIndexChange={setActiveIndex}
            onOpenLibrary={openLibrary}
          />

          <div className="relative mt-2 flex items-center justify-end border-t border-zinc-200/70 pt-2">
            <button
              type="button"
              onClick={openLibrary}
              className="group/cta inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
            >
              <span>Tüm rehberi aç</span>
              <i className="fa-solid fa-arrow-right text-[9px] transition-transform group-hover/cta:translate-x-0.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
