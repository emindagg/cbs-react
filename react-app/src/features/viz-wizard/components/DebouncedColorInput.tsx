/**
 * Debounced color input — wraps <input type="color">.
 *
 * `<input type="color">` emits onChange continuously while the OS color
 * picker dialog is open. Without throttling, each tick updates the store
 * and triggers heavy side effects (setPaintProperty across hundreds of
 * districts, label layer add/remove, downstream re-renders) which can
 * lock the tab. This component holds local state and commits the value
 * after a short idle window, with an immediate flush on close/blur.
 */

import { useCallback, useEffect, useRef, useState } from 'react'


const DEFAULT_DEBOUNCE_MS = 120

interface DebouncedColorInputProps {
  value: string
  onChange: (color: string) => void
  className?: string
  title?: string
  debounceMs?: number
}

export function DebouncedColorInput({
  value,
  onChange,
  className,
  title,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: DebouncedColorInputProps) {
  const [local, setLocal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<string | null>(null)

  if (value !== prevValue) {
    setPrevValue(value)
    if (pendingRef.current === null) setLocal(value)
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (pendingRef.current !== null && pendingRef.current !== value) {
      onChange(pendingRef.current)
    }
    pendingRef.current = null
  }, [onChange, value])

  const handleChange = useCallback((next: string) => {
    setLocal(next)
    pendingRef.current = next
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (pendingRef.current !== null) {
        onChange(pendingRef.current)
        pendingRef.current = null
      }
    }, debounceMs)
  }, [onChange, debounceMs])

  return (
    <input
      type="color"
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={flush}
      className={className}
      title={title}
    />
  )
}
