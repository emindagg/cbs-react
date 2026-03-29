import { useEffect, useRef, useState } from 'react'

import { EXPORT_FORMATS } from '../constants/formats'
import type { ExportFormat } from '../types'

interface ExportControlsProps {
  exportFormat: ExportFormat
  onFormatChange: (format: ExportFormat) => void
  onExport: () => void
  /** Örn. "Veri Yönetimi" / "Proje Yönetimi" bölümlerinde farklı metin */
  exportButtonLabel?: string
}

export function ExportControls({
  exportFormat,
  onFormatChange,
  onExport,
  exportButtonLabel = 'Veriyi İndir',
}: ExportControlsProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = EXPORT_FORMATS.find(f => f.value === exportFormat)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <div className="mb-3">
        <label className="block text-xs font-medium text-zinc-700 mb-1">
          Dışa Aktarma Formatı
        </label>
        <div className="relative" ref={rootRef}>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent flex items-center justify-between gap-2 text-left"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="truncate">{selected?.label}</span>
            <i
              className={`fa-solid fa-chevron-down text-xs text-zinc-500 shrink-0 ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {open && (
            <ul
              role="listbox"
              className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
            >
              {EXPORT_FORMATS.map(format => {
                const active = exportFormat === format.value
                return (
                  <li key={format.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onFormatChange(format.value)
                        setOpen(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2a2a2c] hover:text-white/70 active:bg-[#2c2c2e] ${
                        active ? 'bg-slate-100 font-medium text-slate-900' : 'text-zinc-900'
                      }`}
                    >
                      {format.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="w-full h-9 min-h-9 bg-zinc-900 hover:bg-black text-white text-xs font-medium px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm mb-2"
      >
        <i className="fa-solid fa-download text-[11px]" aria-hidden />
        {exportButtonLabel}
      </button>
    </>
  )
}
