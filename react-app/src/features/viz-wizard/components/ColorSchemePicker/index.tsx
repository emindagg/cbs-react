/**
 * ColorSchemePicker — Compact custom dropdown showing discrete color swatches.
 * Each palette is displayed as a row of color blocks (no text).
 * Hovering shows the palette name as a tooltip.
 */

import { useEffect, useRef, useState } from 'react'

import { COLOR_SCHEME_LIST, COLOR_SCHEMES } from '@/constants/colorSchemes'
import type { ColorScheme } from '@/types/visualization'

interface ColorSchemePickerProps {
  value: ColorScheme
  onChange: (value: ColorScheme) => void
}

function GradientBar({ scheme }: { scheme: ColorScheme }) {
  const colors = COLOR_SCHEMES[scheme]
  return (
    <div
      className="h-full w-full rounded"
      style={{ background: `linear-gradient(to right, ${colors.join(', ')})` }}
    />
  )
}

export default function ColorSchemePicker({ value, onChange }: ColorSchemePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = COLOR_SCHEME_LIST.find(s => s.value === value)?.label ?? value

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function select(scheme: ColorScheme) {
    onChange(scheme)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={selectedLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={[
          'w-full h-6 rounded border cursor-pointer flex items-center gap-2 px-1.5',
          'focus:outline-none transition-colors',
          open
            ? 'border-emerald-400 ring-1 ring-emerald-400'
            : 'border-zinc-200 hover:border-zinc-300',
        ].join(' ')}
      >
        <div className="flex-1 h-3.5 rounded overflow-hidden">
          <GradientBar scheme={value} />
        </div>
        <i className={`shrink-0 fa-solid fa-chevron-${open ? 'up' : 'down'} text-[8px] text-zinc-400`} />
      </button>

      {/* Dropdown — in-flow so it pushes the card height down */}
      {open && (
        <ul
          role="listbox"
          aria-label="Renk Paleti"
          className="w-full mt-1 border border-zinc-200 rounded overflow-hidden py-0.5"
        >
          {COLOR_SCHEME_LIST.map(scheme => {
            const isSelected = scheme.value === value
            return (
              <li
                key={scheme.value}
                role="option"
                aria-selected={isSelected}
                title={scheme.label}
                onClick={() => select(scheme.value)}
                className={[
                  'mx-1 my-0.5 h-5 rounded cursor-pointer transition-all relative',
                  isSelected
                    ? 'ring-2 ring-emerald-500 ring-offset-1'
                    : 'overflow-hidden hover:ring-1 hover:ring-zinc-300',
                ].join(' ')}
              >
                <GradientBar scheme={scheme.value} />
                {isSelected && (
                  <span className="absolute inset-y-0 right-1 flex items-center">
                    <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 shadow">
                      <i className="fa-solid fa-check text-white" style={{ fontSize: 7 }} />
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
