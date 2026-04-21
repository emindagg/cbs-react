/**
 * Dot Density Settings
 * Controls: dot value (input), dot size (slider), dots-represent label
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SingleSlider } from '@/components/ui'
import type { VisualizationSettings } from '@/types/visualization'

import { DotColorPicker } from './DotColorPicker'
import { isValueInCustomRange, resolveCustomRange } from '../../shared/customRange'
import {
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_OPACITY,
  DEFAULT_DOT_SIZE,
  MAX_DOTS_PER_FEATURE,
  MAX_TOTAL_DOTS,
} from '../constants/dot-density'
import { calculateSmartDotValue } from '../utils/dot-density'


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
  const smartDotValue = useMemo(() => calculateSmartDotValue(dataValues), [dataValues])

  const effectiveDotValue = vizSettings.dotValue ?? smartDotValue
  const currentDotSize = vizSettings.dotSize ?? DEFAULT_DOT_SIZE
  const currentDotLabel = vizSettings.dotLabel ?? ''
  const currentDotColor = vizSettings.dotColor ?? DEFAULT_DOT_COLOR
  const currentDotOpacity = vizSettings.dotOpacity ?? DEFAULT_DOT_OPACITY

  // outOfRangeMode:'transparent' aktifse kapsam dışı değerleri dışla (renderer gizler)
  const visibleValues = useMemo(() => {
    const resolvedRange = resolveCustomRange(vizSettings.customRange, dataValues)
    if (!resolvedRange || resolvedRange.outOfRangeMode !== 'transparent') return dataValues
    return dataValues.filter((v) => isValueInCustomRange(v, resolvedRange))
  }, [dataValues, vizSettings.customRange])

  // Renderer ile aynı mantık: her değer tek tek yuvarlanıp toplanır
  const dotCount = useMemo(
    () => effectiveDotValue > 0
      ? Math.min(
        visibleValues.reduce((sum, v) => sum + Math.min(Math.round(Math.abs(v) / effectiveDotValue), MAX_DOTS_PER_FEATURE), 0),
        MAX_TOTAL_DOTS,
      )
      : 0,
    [visibleValues, effectiveDotValue],
  )

  /* ── dotValue debounce (input) ── */
  const [inputStr, setInputStr] = useState(() =>
    vizSettings.dotValue !== undefined ? vizSettings.dotValue.toLocaleString('tr-TR') : '',
  )
  const dotValueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [prevDotValue, setPrevDotValue] = useState(vizSettings.dotValue)

  // Dışarıdan dotValue değişince inputStr'i senkronize et (React "store prev value" pattern)
  if (prevDotValue !== vizSettings.dotValue) {
    setPrevDotValue(vizSettings.dotValue)
    setInputStr(vizSettings.dotValue !== undefined ? vizSettings.dotValue.toLocaleString('tr-TR') : '')
  }

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

  /* ── Cleanup ── */
  useEffect(() => () => {
    if (dotValueTimerRef.current) clearTimeout(dotValueTimerRef.current)
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

      {/* Dot Size */}
      <SingleSlider
        label="Nokta boyutu"
        min={0.5}
        max={10}
        step={0.1}
        value={currentDotSize}
        formatValue={(v) => `${v.toFixed(1)} px`}
        onChange={(v) => setVizSettings({ dotSize: v })}
      />

      {/* Dot Opacity */}
      <SingleSlider
        label="Şeffaflık"
        min={0}
        max={1}
        step={0.05}
        value={currentDotOpacity}
        formatValue={(v) => `%${Math.round(v * 100)}`}
        onChange={(v) => setVizSettings({ dotOpacity: v })}
      />
    </div>
  )
}
