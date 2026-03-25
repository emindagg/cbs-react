/**
 * Custom Breaks Input
 * Allows users to enter custom break values for classification
 * Numbers are formatted with Turkish thousands separator (.) in real-time.
 */

import { useCallback, useState } from 'react'

import {
  MAX_CUSTOM_BREAK_VALUES,
  MIN_CUSTOM_BREAK_VALUES,
  isValidCustomBreaksLength,
} from '../constants'

interface CustomBreaksInputProps {
  customBreaks: number[] | undefined
  onChange: (breaks: number[]) => void
}

/** Sayıyı Türkçe binlik ayraçlı formata çevirir: 1000000 → "1.000.000" */
function formatWithThousands(raw: string): string {
  // Sadece rakamları ve eksi işaretini koru
  const cleaned = raw.replace(/[^\d-]/g, '')
  if (!cleaned || cleaned === '-') return raw
  const n = parseInt(cleaned, 10)
  if (Number.isNaN(n)) return raw
  return n.toLocaleString('tr-TR')
}

/**
 * Virgülle ayrılmış girişi anlık formatlar.
 * "1000, 50000" → "1.000, 50.000"
 */
function formatInput(input: string): string {
  return input
    .split(/[,;]+/)
    .map((part) => formatWithThousands(part.trim()))
    .join(', ')
}

function parseBreaks(input: string): { breaks: number[]; error: string | null } {
  const parts = input
    .split(/[,;\\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (parts.length < MIN_CUSTOM_BREAK_VALUES) {
    return {
      breaks: [],
      error: `En az ${MIN_CUSTOM_BREAK_VALUES} sınır değeri gerekli (3 sınıf)`,
    }
  }

  if (parts.length > MAX_CUSTOM_BREAK_VALUES) {
    return {
      breaks: [],
      error: `En fazla ${MAX_CUSTOM_BREAK_VALUES} sınır değeri girilebilir (7 sınıf)`,
    }
  }

  const nums: number[] = []
  for (const part of parts) {
    // Binlik ayraç (nokta) kaldırılarak parse edilir
    const normalized = part.replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    if (Number.isNaN(n)) {
      return { breaks: [], error: `"${part}" geçerli bir sayı değil` }
    }
    nums.push(n)
  }

  // Check ascending order
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) {
      return { breaks: [], error: 'Değerler artan sırada olmalı' }
    }
  }

  return { breaks: nums, error: null }
}

export function CustomBreaksInput({ customBreaks, onChange }: CustomBreaksInputProps) {
  const [input, setInput] = useState(() =>
    customBreaks?.length
      ? customBreaks.map((n) => n.toLocaleString('tr-TR')).join(', ')
      : '',
  )
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      // Anlık binlik ayraç formatlaması
      const formatted = formatInput(value)
      setInput(formatted)

      const { breaks, error: parseError } = parseBreaks(formatted)
      setError(parseError)
      if (!parseError && isValidCustomBreaksLength(breaks.length)) {
        onChange(breaks)
      }
    },
    [onChange],
  )

  const classCount = customBreaks?.length ? customBreaks.length - 1 : 0

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-zinc-500">
        Sınır Değerleri
        <span className="text-zinc-400 ml-1">(4-8 değer, virgülle ayırın)</span>
      </label>
      <input
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="ör: 0, 100, 500, 1.000, 5.000"
        className={`w-full px-2.5 py-1.5 text-[11px] border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${error ? 'border-red-300' : 'border-zinc-200 hover:border-zinc-300'
        }`}
      />
      {error && (
        <p className="text-[9px] text-red-500">{error}</p>
      )}
      {!error && classCount > 0 && (
        <p className="text-[9px] text-zinc-500">
          {classCount} sınıf oluşturulacak ({customBreaks!.length} sınır değeri)
        </p>
      )}
    </div>
  )
}

