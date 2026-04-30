import { forwardRef } from 'react'

import type { VoiceState } from './useVoiceSearch'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  onVoiceClick: () => void
  voiceState: VoiceState
  voiceSupported: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  comboboxId: string
  listboxId: string
  activeOptionId: string | undefined
  expanded: boolean
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar(
  {
    query,
    onQueryChange,
    onVoiceClick,
    voiceState,
    voiceSupported,
    onKeyDown,
    comboboxId,
    listboxId,
    activeOptionId,
    expanded,
  },
  ref,
) {
  const listening = voiceState === 'listening'
  const voiceTitle = !voiceSupported
    ? 'Bu tarayıcı sesli aramayı desteklemiyor'
    : voiceState === 'denied'
      ? 'Mikrofon izni reddedildi'
      : voiceState === 'error'
        ? 'Sesli arama hatası — tekrar deneyin'
        : 'Sesle ara'

  return (
    <div className="relative flex items-center gap-2 rounded-xl border border-zinc-200/70 bg-white/90 px-2.5 py-1.5 shadow-xs">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id={`${comboboxId}-grad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <path
          d="M12 2.5L13.4 9.1L20 10.5L13.4 11.9L12 18.5L10.6 11.9L4 10.5L10.6 9.1Z"
          fill={`url(#${comboboxId}-grad)`}
        />
      </svg>
      <input
        ref={ref}
        id={comboboxId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ne yapmak istersiniz?"
        className="flex-1 bg-transparent text-[12px] text-zinc-900 placeholder-zinc-400 outline-hidden"
        aria-label="Doğal dil ile arama"
      />
      <button
        type="button"
        onClick={onVoiceClick}
        className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-300 ${
          listening
            ? 'bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.25)]'
            : voiceState === 'denied' || voiceState === 'error'
              ? 'text-rose-500 hover:bg-rose-50'
              : 'text-zinc-500 hover:bg-zinc-100 hover:text-emerald-600'
        }`}
        title={voiceTitle}
        aria-label={voiceTitle}
        aria-pressed={listening}
      >
        {listening && (
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
        )}
        <i className="fa-solid fa-microphone relative text-[10px]" aria-hidden />
      </button>
    </div>
  )
})
