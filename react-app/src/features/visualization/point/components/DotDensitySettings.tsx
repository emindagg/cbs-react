/**
 * Dot Density Settings
 * Controls: dot value (input), dot size (slider), dots-represent label
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { VisualizationSettings } from '@/types/visualization'

import { DEFAULT_DOT_COLOR, DEFAULT_DOT_SIZE, MAX_TOTAL_DOTS } from '../constants/dot-density'
import { calculateSmartDotValue } from '../utils/dot-density'

import { DotColorPicker } from './DotColorPicker'

/** Debounce süresi — dotValue ve dotSize için ortak */
const DEBOUNCE_MS = 500

interface DotDensitySettingsProps {
  vizSettings: VisualizationSettings
  setVizSettings: (settings: Partial<VisualizationSettings>) => void
  dataValues: number[]
}

export function DotDensitySettings({
  vizSettings,
  setVizSettings,
  dataValues,
}: DotDensitySettingsProps) {
  /* ── Memo'lu hesaplamalar ── */
  const totalValue = useMemo(
    () => dataValues.reduce((sum, v) => sum + Math.abs(v), 0),
    [dataValues],
  )
  const smartDotValue = useMemo(() => calculateSmartDotValue(dataValues), [dataValues])

  const effectiveDotValue = vizSettings.dotValue ?? smartDotValue
  const currentDotSize = vizSettings.dotSize ?? DEFAULT_DOT_SIZE
  const currentDotLabel = vizSettings.dotLabel ?? ''
  const currentDotColor = vizSettings.dotColor ?? DEFAULT_DOT_COLOR

  const dotCount = useMemo(
    () => effectiveDotValue > 0 ? Math.min(Math.round(totalValue / effectiveDotValue), MAX_TOTAL_DOTS) : 0,
    [totalValue, effectiveDotValue],
  )

  /* ── dotValue debounce (input) ── */
  const [inputStr, setInputStr] = useState(() =>
    vizSettings.dotValue !== undefined ? vizSettings.dotValue.toLocaleString('tr-TR') : '',
  )
  const dotValueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (vizSettings.dotValue === undefined) setInputStr('')
    else setInputStr(vizSettings.dotValue.toLocaleString('tr-TR'))
  }, [vizSettings.dotValue])

  const applyDotValue = useCallback(
    (raw: string) => {
      if (raw === '') {
        setVizSettings({ dotValue: undefined })
        return
      }
      const num = parseInt(raw.replace(/\./g, '').replace(/,/g, ''), 10)
      if (!isNaN(num) && num >= 1) setVizSettings({ dotValue: num })
    },
    [setVizSettings],
  )

  const handleDotValueChange = useCallback(
    (raw: string) => {
      if (dotValueTimerRef.current) clearTimeout(dotValueTimerRef.current)
      setInputStr(raw)
      if (raw === '') { applyDotValue(''); return }
      dotValueTimerRef.current = setTimeout(() => applyDotValue(raw), DEBOUNCE_MS)
    },
    [applyDotValue],
  )

  const flushDotValue = useCallback(() => {
    if (dotValueTimerRef.current) clearTimeout(dotValueTimerRef.current)
    applyDotValue(inputStr.trim())
  }, [inputStr, applyDotValue])

  /* ── dotSize debounce (slider + number input) ── */
  const [localDotSize, setLocalDotSize] = useState(currentDotSize)
  const dotSizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Dışarıdan gelen dotSize değişirse yerel state'i senkronla
  useEffect(() => { setLocalDotSize(currentDotSize) }, [currentDotSize])

  const handleDotSizeChange = useCallback(
    (val: number) => {
      if (val < 0.5 || val > 10 || isNaN(val)) return
      setLocalDotSize(val)
      if (dotSizeTimerRef.current) clearTimeout(dotSizeTimerRef.current)
      dotSizeTimerRef.current = setTimeout(() => setVizSettings({ dotSize: val }), DEBOUNCE_MS)
    },
    [setVizSettings],
  )

  const flushDotSize = useCallback(() => {
    if (dotSizeTimerRef.current) clearTimeout(dotSizeTimerRef.current)
    setVizSettings({ dotSize: localDotSize })
  }, [localDotSize, setVizSettings])

  /* ── Cleanup ── */
  useEffect(() => () => {
    if (dotValueTimerRef.current) clearTimeout(dotValueTimerRef.current)
    if (dotSizeTimerRef.current) clearTimeout(dotSizeTimerRef.current)
  }, [])

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-4">
      <h4 className="text-[11px] font-semibold text-zinc-700">Nokta Yoğunluğu</h4>

      {/* Dots Represent Label */}
      <div>
        <label className="text-[10px] font-medium text-zinc-600 mb-1 block">
          Noktaların temsil ettikleri
        </label>
        <input
          type="text"
          value={currentDotLabel}
          onChange={(e) => setVizSettings({ dotLabel: e.target.value })}
          placeholder="ör. Nüfus, Satış, Öğrenci"
          className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Dot Color */}
      <div>
        <label className="text-[10px] font-medium text-zinc-600 mb-1.5 block">
          Simge stili
        </label>
        <div className="flex items-center gap-2">
          <DotColorPicker
            color={currentDotColor}
            onChange={(color) => setVizSettings({ dotColor: color })}
          />
          <span className="text-[10px] text-zinc-500">
            Nokta rengi seçin
          </span>
        </div>
      </div>

      {/* Dot Value — free input */}
      <div>
        <label className="text-[10px] font-medium text-zinc-600 mb-1 block">
          Nokta değeri
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 whitespace-nowrap">1 nokta =</span>
          <input
            type="text"
            inputMode="numeric"
            value={inputStr}
            onChange={(e) => handleDotValueChange(e.target.value)}
            onBlur={flushDotValue}
            placeholder={smartDotValue.toLocaleString('tr-TR')}
            className="flex-1 px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all tabular-nums"
          />
          <span className="text-[10px] text-zinc-500 whitespace-nowrap">
            {currentDotLabel || 'birim'}
          </span>
        </div>

        {/* Smart suggestion chip */}
        {vizSettings.dotValue === undefined && (
          <div className="mt-1.5 flex items-center gap-1">
            <i className="fa-solid fa-wand-magic-sparkles text-[9px] text-amber-500"></i>
            <span className="text-[9px] text-amber-600">
              Önerilen değer: {smartDotValue.toLocaleString('tr-TR')}
            </span>
          </div>
        )}

        {vizSettings.dotValue !== undefined && (
          <button
            onClick={() => setVizSettings({ dotValue: undefined })}
            className="mt-1.5 flex items-center gap-1 text-[9px] text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-rotate-left text-[8px]"></i>
            Otomatiğe dön ({smartDotValue.toLocaleString('tr-TR')})
          </button>
        )}

        {/* Dot value info box */}
        <div className="mt-2 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-[10px] text-blue-700 font-medium text-center">
            1 nokta = {effectiveDotValue.toLocaleString('tr-TR')}
            {currentDotLabel ? ` ${currentDotLabel}` : ' birim'}
          </p>
          <p className="text-[9px] text-blue-500 text-center mt-0.5">
            Toplam ~{dotCount.toLocaleString('tr-TR')} nokta haritada görünecek
            {dotCount >= MAX_TOTAL_DOTS && (
              <span className="text-amber-600"> (maks. {MAX_TOTAL_DOTS.toLocaleString('tr-TR')} limit)</span>
            )}
          </p>
        </div>
      </div>

      {/* Dot Size — debounced */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium text-zinc-600">Nokta boyutu</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.1}
              value={localDotSize}
              onChange={(e) => handleDotSizeChange(parseFloat(e.target.value))}
              onBlur={flushDotSize}
              className="w-14 px-1.5 py-0.5 text-[10px] text-center border border-zinc-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[9px] text-zinc-400">px</span>
          </div>
        </div>

        <input
          type="range"
          min={0.5}
          max={10}
          step={0.1}
          value={localDotSize}
          onChange={(e) => handleDotSizeChange(parseFloat(e.target.value))}
          onPointerUp={flushDotSize}
          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>
    </div>
  )
}
