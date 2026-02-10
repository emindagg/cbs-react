/**
 * Custom Breaks Input
 * Allows users to enter custom break values for classification
 */

import { useState, useCallback } from 'react'

interface CustomBreaksInputProps {
  customBreaks: number[] | undefined
  onChange: (breaks: number[]) => void
}

function parseBreaks(input: string): { breaks: number[]; error: string | null } {
  const parts = input
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (parts.length < 2) {
    return { breaks: [], error: 'En az 2 sınır değeri gerekli' }
  }

  const nums: number[] = []
  for (const part of parts) {
    const n = Number(part)
    if (isNaN(n)) {
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
    customBreaks?.length ? customBreaks.join(', ') : '',
  )
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback(
    (value: string) => {
      setInput(value)
      const { breaks, error: parseError } = parseBreaks(value)
      setError(parseError)
      if (!parseError && breaks.length >= 2) {
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
        <span className="text-zinc-400 ml-1">(virgülle ayırın)</span>
      </label>
      <input
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="ör: 0, 100, 500, 1000, 5000"
        className={`w-full px-2.5 py-1.5 text-[11px] border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
          error ? 'border-red-300' : 'border-zinc-200 hover:border-zinc-300'
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
