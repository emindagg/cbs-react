import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { MoonPhaseDisplay } from './MoonPhaseDisplay'
import { useAstroStore } from '../stores/useAstroStore'

const MIN_ASTRO_SPEED = 0.1
const MAX_ASTRO_SPEED = 100

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatBrowserUtcOffset(offsetMinutes: number): string {
  const totalMinutes = -offsetMinutes
  const sign = totalMinutes >= 0 ? '+' : '-'
  const absMinutes = Math.abs(totalMinutes)
  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60

  if (minutes === 0) {
    return `UTC${sign}${hours}`
  }

  return `UTC${sign}${hours}:${pad2(minutes)}`
}

function parseDateTimeLocal(value: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
} | null {
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  if ([year, month, day, hour, minute].some((v) => Number.isNaN(v))) return null

  return { year, month, day, hour, minute }
}

function formatInputByMode(date: Date, mode: 'local' | 'utc'): string {
  if (mode === 'utc') {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function parseInputByMode(value: string, mode: 'local' | 'utc'): Date {
  const parts = parseDateTimeLocal(value)
  if (!parts) return new Date('invalid')

  if (mode === 'utc') {
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute))
  }

  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
}

export function AstroPanel() {
  const {
    isEnabled,
    currentDate,
    moonPhaseAngle,
    speed,
    timeMode,
    isPlaying,
    features,
    setCurrentDate,
    setSpeed,
    setTimeMode,
    setIsPlaying,
    toggleFeature,
  } = useAstroStore()

  const nowToleranceMs = 1000 * 60
  const [nowTimestamp, setNowTimestamp] = useState(0)
  const browserUtcLabel = useMemo(
    () => formatBrowserUtcOffset(new Date(nowTimestamp || currentDate.getTime()).getTimezoneOffset()),
    [nowTimestamp, currentDate],
  )
  const inputValue = useMemo(
    () => formatInputByMode(currentDate, timeMode),
    [currentDate, timeMode],
  )

  useEffect(() => {
    const updateNow = () => setNowTimestamp(Date.now())
    updateNow()

    const timerId = window.setInterval(updateNow, 1000 * 30)
    return () => window.clearInterval(timerId)
  }, [])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseInputByMode(e.target.value, timeMode)
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate)
    }
  }

  const isNowSelected = Math.abs(nowTimestamp - currentDate.getTime()) <= nowToleranceMs

  useEffect(() => {
    if (isPlaying || !isNowSelected) return

    const timerId = window.setInterval(() => {
      setCurrentDate(new Date())
    }, 1000 * 30)

    return () => window.clearInterval(timerId)
  }, [isPlaying, isNowSelected, setCurrentDate])

  if (!isEnabled) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed top-20 right-4 z-10002 w-[204px] font-['Outfit']"
      >
        <div className="overflow-hidden rounded-[24px] border border-white/70 bg-linear-to-br from-[#f8fafc] via-[#f5f7fb] to-[#edf2f9] shadow-[0_18px_34px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/65 px-3 py-2.5 backdrop-blur-[1px]">
            <div className="flex items-center gap-2.5">
              <div>
                <h3 className="text-[10px] font-bold tracking-tight text-slate-900">Astronomi Modülü</h3>
                {isPlaying && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                    <span className="text-[8px] font-bold uppercase text-emerald-700">Canlı İzleme</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex rounded-xl border border-slate-300/90 bg-slate-100 p-0.5 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)]">
                {['local', 'utc'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTimeMode(mode as 'local' | 'utc')}
                    className={`rounded-lg px-1.5 py-0.5 text-[8px] font-bold transition-colors ${timeMode === mode
                      ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.14)]'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode === 'local' ? 'YEREL' : mode.toUpperCase()}
                  </button>
                ))}
              </div>
              {timeMode === 'local' && (
                <span className="rounded-md border border-slate-300/90 bg-white/75 px-1.5 py-0.5 text-[7px] font-bold tracking-wide text-slate-600">
                  {browserUtcLabel}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">Zaman</label>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[8px] font-bold transition-colors ${isNowSelected
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  ŞİMDİ
                </button>
              </div>
              <input
                type="datetime-local"
                value={inputValue}
                onChange={handleDateChange}
                className="w-full rounded-xl border border-slate-300/85 bg-white px-2.5 py-2 text-[10px] font-['JetBrains_Mono'] text-slate-800 shadow-[inset_0_1px_1px_rgba(15,23,42,0.05)] outline-hidden transition-colors focus:border-slate-500"
              />
            </div>

            <div className="space-y-2.5 border-t border-slate-200/80 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-500">Hız</label>
                <span className="rounded-lg border border-slate-300/90 bg-white px-1.5 py-0.5 text-[9px] font-bold font-['JetBrains_Mono'] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
                  {speed.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min={MIN_ASTRO_SPEED}
                max={MAX_ASTRO_SPEED}
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-700"
              />

              <div>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border text-[8px] font-bold uppercase tracking-wider transition-colors ${isPlaying
                    ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                    : 'border-none bg-[#1c1c1e] text-white hover:bg-[#2a2a2c] active:bg-[#2c2c2e]'
                  }`}
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[8px]`}></i>
                  {isPlaying ? 'Durdur' : 'Başlat'}
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-3">
              <div className="grid grid-cols-1 gap-1.5">
                <MatrixToggle
                  icon="fa-sun"
                  label="Güneş Konumu"
                  checked={features.sunPosition}
                  onChange={() => toggleFeature('sunPosition')}
                  activeColor="text-amber-700 bg-amber-50"
                />
                <MatrixToggle
                  icon="fa-circle-half-stroke"
                  label="Aydınlanma Çizgisi"
                  checked={features.terminator}
                  onChange={() => toggleFeature('terminator')}
                  activeColor="text-indigo-700 bg-indigo-50"
                />
                <MatrixToggle
                  icon="fa-moon"
                  label="Ay Evreleri"
                  checked={features.moonPhase}
                  onChange={() => toggleFeature('moonPhase')}
                  activeColor="text-slate-700 bg-slate-100"
                  customLeading={<MoonPhaseDisplay phaseAngle={moonPhaseAngle} />}
                />
                <MatrixToggle
                  icon="fa-earth-americas"
                  label="Eksen Eğikliği"
                  checked={features.axialTilt}
                  onChange={() => toggleFeature('axialTilt')}
                  activeColor="text-sky-700 bg-sky-50"
                />
                <MatrixToggle
                  icon="fa-cloud-moon"
                  label="Tutulma Analizi"
                  checked={features.eclipses}
                  onChange={() => toggleFeature('eclipses')}
                  activeColor="text-rose-700 bg-rose-50"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface MatrixToggleProps {
  icon: string
  label: string
  checked: boolean
  onChange: () => void
  activeColor: string
  customLeading?: React.ReactNode
}

function MatrixToggle({ icon, label, checked, onChange, activeColor, customLeading }: MatrixToggleProps) {
  return (
    <label
      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors ${checked
        ? 'border-slate-300 bg-white/85 shadow-[0_2px_10px_rgba(15,23,42,0.08)]'
        : 'border-slate-300/90 bg-white/70 hover:border-slate-400 hover:bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {customLeading || (
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${checked ? activeColor : 'border border-slate-300 bg-slate-100 text-slate-500'}`}>
            <i className={`fa-solid ${icon} text-[10px]`}></i>
          </div>
        )}
        <span className={`text-[9px] font-bold leading-tight transition-colors ${checked ? 'text-slate-800' : 'text-slate-600'}`}>
          {label}
        </span>
      </div>

      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <div className="h-4 w-8 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:shadow-[0_1px_2px_rgba(15,23,42,0.25)] after:transition-transform peer-checked:after:translate-x-4"></div>
      </div>
    </label>
  )
}


