/**
 * Custom Range Configuration
 * Allows manual setting of min, center, and max values for color scale
 */

import { useState } from 'react'

import type { CustomRange } from '../../types/visualization'

interface CustomRangeConfigProps {
  customRange: CustomRange;
  autoMin: number;
  autoMax: number;
  onChange: (range: CustomRange) => void;
}

export default function CustomRangeConfig({
  customRange,
  autoMin,
  autoMax,
  onChange,
}: CustomRangeConfigProps) {
  const [localMin, setLocalMin] = useState<string>(customRange.min?.toString() || '')
  const [localCenter, setLocalCenter] = useState<string>(customRange.center?.toString() || '')
  const [localMax, setLocalMax] = useState<string>(customRange.max?.toString() || '')
  const [errors, setErrors] = useState<{
    min?: string;
    center?: string;
    max?: string;
  }>({})

  // Sync local state when customRange changes from parent (getDerivedStateFromProps-style, no ref/effect)
  const [prevRange, setPrevRange] = useState({
    min: customRange.min,
    center: customRange.center,
    max: customRange.max,
  })
  if (
    customRange.min !== prevRange.min ||
    customRange.center !== prevRange.center ||
    customRange.max !== prevRange.max
  ) {
    setPrevRange({
      min: customRange.min,
      center: customRange.center,
      max: customRange.max,
    })
    setLocalMin(customRange.min?.toString() || '')
    setLocalCenter(customRange.center?.toString() || '')
    setLocalMax(customRange.max?.toString() || '')
  }

  const validateAndUpdate = (field: 'min' | 'center' | 'max', value: string) => {
    const numValue = value === '' ? null : Number.parseFloat(value)

    // Update local state immediately for UX
    switch (field) {
      case 'min':
        setLocalMin(value)
        break
      case 'center':
        setLocalCenter(value)
        break
      case 'max':
        setLocalMax(value)
        break
    }

    // Validate
    const newErrors: typeof errors = {}
    const newRange = { ...customRange }

    switch (field) {
      case 'min':
        newRange.min = numValue
        if (numValue !== null && newRange.max !== null && numValue >= newRange.max) {
          newErrors.min = 'Minimum değer, maksimum değerden küçük olmalı'
        }
        break

      case 'center':
        newRange.center = numValue
        if (numValue !== null) {
          if (newRange.min !== null && numValue <= newRange.min) {
            newErrors.center = 'Orta değer, minimum değerden büyük olmalı'
          }
          if (newRange.max !== null && numValue >= newRange.max) {
            newErrors.center = 'Orta değer, maksimum değerden küçük olmalı'
          }
        }
        break

      case 'max':
        newRange.max = numValue
        if (numValue !== null && newRange.min !== null && numValue <= newRange.min) {
          newErrors.max = 'Maksimum değer, minimum değerden büyük olmalı'
        }
        break
    }

    setErrors(newErrors)

    // Only update parent if no errors
    if (Object.keys(newErrors).length === 0) {
      onChange(newRange)
    }
  }

  const toggleEnabled = () => {
    if (customRange.enabled) {
      // Disable: reset to null values
      onChange({
        enabled: false,
        min: null,
        center: null,
        max: null,
      })
      setLocalMin('')
      setLocalCenter('')
      setLocalMax('')
    } else {
      // Enable: keep current values or set to auto
      onChange({
        ...customRange,
        enabled: true,
      })
    }
  }

  const autoCenter = (autoMin + autoMax) / 2

  return (
    <div className="space-y-3">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-medium text-zinc-600">
            Özel Aralık
          </label>
          <button
            className="w-3.5 h-3.5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 text-[9px]"
            title="Min, Orta ve Maks değerleri manuel ayarlayarak renk paletini belirli bir aralığa 'sabitleyin'. Bu, farklı haritaları karşılaştırırken tutarlı renklendirme sağlar."
          >
            ?
          </button>
        </div>
        <button
          onClick={toggleEnabled}
          className={`
            w-12 h-6 rounded-full transition-all relative
            ${customRange.enabled ? 'bg-blue-500' : 'bg-zinc-300'}
          `}
        >
          <div
            className={`
              w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all
              ${customRange.enabled ? 'left-6' : 'left-0.5'}
            `}
          />
        </button>
      </div>

      {customRange.enabled && (
        <div className="space-y-2.5">
          {/* Min Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-zinc-600">
                Minimum
              </label>
              <span className="text-[9px] text-zinc-400">
                Otomatik: {autoMin.toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              value={localMin}
              onChange={(e) => validateAndUpdate('min', e.target.value)}
              placeholder={autoMin.toString()}
              className={`
                w-full px-2.5 py-1.5 text-[11px] border rounded
                ${
        errors.min
          ? 'border-red-500 focus:ring-red-500'
          : 'border-zinc-200 focus:ring-blue-500'
        }
                focus:outline-none focus:ring-1
              `}
            />
            {errors.min && (
              <p className="text-[9px] text-red-500 mt-0.5">{errors.min}</p>
            )}
          </div>

          {/* Center Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-zinc-600">
                Orta
              </label>
              <span className="text-[9px] text-zinc-400">
                Otomatik: {autoCenter.toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              value={localCenter}
              onChange={(e) => validateAndUpdate('center', e.target.value)}
              placeholder={autoCenter.toString()}
              className={`
                w-full px-2.5 py-1.5 text-[11px] border rounded
                ${
        errors.center
          ? 'border-red-500 focus:ring-red-500'
          : 'border-zinc-200 focus:ring-blue-500'
        }
                focus:outline-none focus:ring-1
              `}
            />
            {errors.center && (
              <p className="text-[9px] text-red-500 mt-0.5">{errors.center}</p>
            )}
          </div>

          {/* Max Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-zinc-600">
                Maksimum
              </label>
              <span className="text-[9px] text-zinc-400">
                Otomatik: {autoMax.toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              value={localMax}
              onChange={(e) => validateAndUpdate('max', e.target.value)}
              placeholder={autoMax.toString()}
              className={`
                w-full px-2.5 py-1.5 text-[11px] border rounded
                ${
        errors.max
          ? 'border-red-500 focus:ring-red-500'
          : 'border-zinc-200 focus:ring-blue-500'
        }
                focus:outline-none focus:ring-1
              `}
            />
            {errors.max && (
              <p className="text-[9px] text-red-500 mt-0.5">{errors.max}</p>
            )}
          </div>

          {/* Info Text */}
          <div className="text-[9px] text-zinc-400 leading-relaxed pt-1 border-t border-zinc-100">
            💡 Özel aralık kullanarak farklı zaman dilimlerindeki haritaları aynı renk skalasıyla
            karşılaştırabilirsiniz.
          </div>
        </div>
      )}
    </div>
  )
}
