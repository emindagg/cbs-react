/**
 * Custom range state, sync, validation and toggle (CustomRangeConfig içinde kullanılır)
 */

import { useState } from 'react'

import type { CustomRange } from '@/types/visualization'

export type CustomRangeErrors = { min?: string; center?: string; max?: string }

function formatNumberForInput(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return value.toLocaleString('tr-TR', { maximumFractionDigits: 6 })
}

function formatWithThousandSeparators(raw: string): string {
  const cleaned = raw.replace(/[^\d,.-]/g, '')
  if (cleaned === '') return ''
  if (cleaned === '-') return '-'

  const negative = cleaned.startsWith('-')
  const withoutSign = cleaned.replace(/-/g, '')
  const normalized = withoutSign.replace(/\./g, '')

  const firstComma = normalized.indexOf(',')
  const hasComma = firstComma !== -1
  const intRaw = hasComma ? normalized.slice(0, firstComma) : normalized
  const fracRaw = hasComma ? normalized.slice(firstComma + 1).replace(/,/g, '') : ''

  const intDigits = intRaw.replace(/\D/g, '')
  const fracDigits = fracRaw.replace(/\D/g, '')
  const groupedInt = (intDigits === '' ? '0' : intDigits).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const signedInt = negative ? `-${groupedInt}` : groupedInt

  return hasComma ? `${signedInt},${fracDigits}` : signedInt
}

function parseFormattedInput(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === '-') return null
  const normalized = trimmed.replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

export function useCustomRange(
  customRange: CustomRange,
  onChange: (range: CustomRange) => void,
) {
  const [localMin, setLocalMin] = useState<string>(formatNumberForInput(customRange.min))
  const [localCenter, setLocalCenter] = useState<string>(formatNumberForInput(customRange.center))
  const [localMax, setLocalMax] = useState<string>(formatNumberForInput(customRange.max))
  const [errors, setErrors] = useState<CustomRangeErrors>({})

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
    setLocalMin(formatNumberForInput(customRange.min))
    setLocalCenter(formatNumberForInput(customRange.center))
    setLocalMax(formatNumberForInput(customRange.max))
  }

  const validateAndUpdate = (field: 'min' | 'center' | 'max', value: string) => {
    const formatted = formatWithThousandSeparators(value)
    const numValue = parseFormattedInput(formatted)

    switch (field) {
      case 'min':
        setLocalMin(formatted)
        break
      case 'center':
        setLocalCenter(formatted)
        break
      case 'max':
        setLocalMax(formatted)
        break
    }

    const newErrors: CustomRangeErrors = {}
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
    if (Object.keys(newErrors).length === 0) {
      onChange(newRange)
    }
  }

  const toggleEnabled = () => {
    if (customRange.enabled) {
      onChange({
        enabled: false,
        min: null,
        center: null,
        max: null,
        outOfRangeMode: customRange.outOfRangeMode ?? 'gray',
      })
      setLocalMin('')
      setLocalCenter('')
      setLocalMax('')
    } else {
      onChange({ ...customRange, enabled: true, outOfRangeMode: customRange.outOfRangeMode ?? 'gray' })
    }
  }

  return { localMin, localCenter, localMax, errors, validateAndUpdate, toggleEnabled }
}
