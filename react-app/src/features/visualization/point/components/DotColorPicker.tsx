import chroma from 'chroma-js'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

const COLOR_DEBOUNCE_MS = 400
// WCAG AA contrast ratio minimum for normal text
const MIN_CONTRAST_RATIO = 4.5

interface DotColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  // Row 1
  '#22a1c4', '#1b7a9e', '#164c63', '#00d0b1', '#2eb88d', '#158564',
  // Row 2
  '#c0c0c0', '#e52d2d', '#d97757', '#ffcc33', '#fff3ac', '#fce2ad',
]

export function DotColorPicker({ color, onChange }: DotColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalColor, setInternalColor] = useState(color)
  const popoverRef = useRef<HTMLDivElement>(null)
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync internal color when prop changes
  useEffect(() => {
    setInternalColor(color)
  }, [color])

  // Cleanup timer
  useEffect(() => () => { if (colorTimerRef.current) clearTimeout(colorTimerRef.current) }, [])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  /** Debounced renk güncelleme — slider sürüklerken harita her kareyi yeniden çizmez */
  const debouncedOnChange = useCallback(
    (hex: string) => {
      if (colorTimerRef.current) clearTimeout(colorTimerRef.current)
      colorTimerRef.current = setTimeout(() => onChange(hex), COLOR_DEBOUNCE_MS)
    },
    [onChange],
  )

  /** Flush: slider bırakıldığında veya popover kapanırken bekleyen rengi hemen uygula */
  const flushColor = useCallback(() => {
    if (colorTimerRef.current) clearTimeout(colorTimerRef.current)
    onChange(internalColor)
  }, [internalColor, onChange])

  const handleConfirm = () => {
    flushColor()
    setIsOpen(false)
  }

  const handlePresetClick = (preset: string) => {
    setInternalColor(preset)
    onChange(preset) // Preset seçimi anında uygulansın
  }

  const hql = chroma(internalColor).hsl()
  const hue = isNaN(hql[0]) ? 0 : hql[0]
  const sat = hql[1]
  const lum = hql[2]

  const handleHueChange = (val: number) => {
    const newColor = chroma.hsl(val, sat, lum).hex()
    setInternalColor(newColor)
    debouncedOnChange(newColor)
  }

  const handleSatChange = (val: number) => {
    const newColor = chroma.hsl(hue, val, lum).hex()
    setInternalColor(newColor)
    debouncedOnChange(newColor)
  }

  const handleLumChange = (val: number) => {
    const newColor = chroma.hsl(hue, sat, val).hex()
    setInternalColor(newColor)
    debouncedOnChange(newColor)
  }

  // Gradient backgrounds for sliders
  const hueGradient = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
  const satGradient = `linear-gradient(to right, ${chroma.hsl(hue, 0, lum).hex()}, ${chroma.hsl(hue, 1, lum).hex()})`
  const lumGradient = `linear-gradient(to right, #000, ${chroma.hsl(hue, sat, 0.5).hex()}, #fff)`

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 border border-zinc-200 rounded-md bg-white hover:border-zinc-300 transition-colors shadow-sm"
      >
        <div
          className="w-8 h-6 rounded shadow-inner border border-black/5"
          style={{ backgroundColor: color }}
        />
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 left-0 w-[240px] bg-white border border-zinc-200 rounded-lg shadow-xl p-4"
          >
            {/* Preset Grid */}
            <div className="grid grid-cols-6 gap-2 mb-4">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handlePresetClick(c)}
                  className={`w-7 h-7 rounded border transition-all hover:scale-110 shadow-sm ${internalColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-blue-500 ring-offset-1 border-white' : 'border-zinc-200'}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-3 mb-4">
              {/* Lightness Slider */}
              <div className="relative h-4 rounded-md border border-zinc-100 overflow-hidden" style={{ background: lumGradient }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={lum}
                  onChange={(e) => handleLumChange(parseFloat(e.target.value))}
                  onPointerUp={flushColor}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute h-[120%] w-2 border-2 border-black rounded-sm shadow-md pointer-events-none top-1/2 -translate-y-1/2"
                  style={{ left: `calc(${lum * 100}% - 4px)` }}
                />
              </div>

              {/* Saturation Slider */}
              <div className="relative h-4 rounded-md border border-zinc-100 overflow-hidden" style={{ background: satGradient }}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sat}
                  onChange={(e) => handleSatChange(parseFloat(e.target.value))}
                  onPointerUp={flushColor}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute h-[120%] w-2 border-2 border-black rounded-sm shadow-md pointer-events-none top-1/2 -translate-y-1/2"
                  style={{ left: `calc(${sat * 100}% - 4px)` }}
                />
              </div>

              {/* Hue Slider */}
              <div className="relative h-4 rounded-md border border-zinc-100 overflow-hidden" style={{ background: hueGradient }}>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hue}
                  onChange={(e) => handleHueChange(parseFloat(e.target.value))}
                  onPointerUp={flushColor}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute h-[120%] w-2 border-2 border-black rounded-sm shadow-md pointer-events-none top-1/2 -translate-y-1/2"
                  style={{ left: `calc(${(hue / 360) * 100}% - 4px)` }}
                />
              </div>
            </div>

            {/* Bottom Row: Hex + Confirm */}
            <div className="flex items-center gap-2 border-t border-zinc-100 pt-3">
              <div
                className="flex-1 flex items-center overflow-hidden border border-black/5 rounded-md transition-colors"
                style={{ backgroundColor: internalColor }}
              >
                <input
                  type="text"
                  value={internalColor.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value
                    if (chroma.valid(val)) {
                      setInternalColor(val)
                      debouncedOnChange(val)
                    }
                  }}
                  onBlur={flushColor}
                  className="w-full h-8 px-3 text-[12px] font-bold outline-none bg-transparent"
                  style={{ color: chroma.contrast(internalColor, 'white') > MIN_CONTRAST_RATIO ? 'white' : 'black' }}
                />
              </div>
              <button
                onClick={handleConfirm}
                className="w-10 h-8 flex items-center justify-center border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-sm"
                title="Onayla"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
