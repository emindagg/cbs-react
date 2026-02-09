/**
 * Custom range state, sync, validation and toggle (CustomRangeConfig içinde kullanılır)
 */

import { useState } from 'react'

import type { CustomRange } from '@/types/visualization'

export type CustomRangeErrors = { min?: string; center?: string; max?: string }

export function useCustomRange(
  customRange: CustomRange,
  onChange: (range: CustomRange) => void,
) {
  const [localMin, setLocalMin] = useState<string>(customRange.min?.toString() || '')
  const [localCenter, setLocalCenter] = useState<string>(customRange.center?.toString() || '')
  const [localMax, setLocalMax] = useState<string>(customRange.max?.toString() || '')
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
    setLocalMin(customRange.min?.toString() || '')
    setLocalCenter(customRange.center?.toString() || '')
    setLocalMax(customRange.max?.toString() || '')
  }

  const validateAndUpdate = (field: 'min' | 'center' | 'max', value: string) => {
    const numValue = value === '' ? null : Number.parseFloat(value)

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
      onChange({ enabled: false, min: null, center: null, max: null })
      setLocalMin('')
      setLocalCenter('')
      setLocalMax('')
    } else {
      onChange({ ...customRange, enabled: true })
    }
  }

  return { localMin, localCenter, localMax, errors, validateAndUpdate, toggleEnabled }
}
