import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { formatDateForInput } from '../../../utils/dateUtils'
import { useAstroStore } from '../stores/useAstroStore'

const MIN_ASTRO_SPEED = 0.1
const MAX_ASTRO_SPEED = 100

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatUtcForInput(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`
}

function parseInputByMode(value: string, mode: 'local' | 'utc'): Date {
  if (mode === 'local') {
    return new Date(value)
  }

  // datetime-local gives "YYYY-MM-DDTHH:mm"; interpret this as UTC wall clock
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return new Date('invalid')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}

export function AstroPanel() {
  const {
    isEnabled,
    currentDate,
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
  const inputValue = useMemo(
    () => (timeMode === 'utc' ? formatUtcForInput(currentDate) : formatDateForInput(currentDate)),
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
        className="fixed top-20 right-4 z-10002 w-[296px] font-['Outfit']"
      >
        <div className="overflow-hidden rounded-2xl border border-stone-300 bg-[#fcfcfd] shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-sky-50">
                <i className="fa-solid fa-satellite-dish text-[12px] text-sky-700"></i>
              </div>
              <div>
                <h3 className="text-[12px] font-bold tracking-tight text-slate-900">Astronomi Veri Paneli</h3>
                {isPlaying && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></span>
                    <span className="text-[8px] font-bold uppercase text-sky-700">Canlı İzleme</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex rounded-lg border border-stone-300 bg-stone-100 p-0.5">
              {['local', 'utc'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeMode(mode as 'local' | 'utc')}
                  className={`rounded-md px-2.5 py-1 text-[9px] font-bold transition-colors ${timeMode === mode
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Zaman</label>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold transition-colors ${isNowSelected
                    ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
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
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[11px] font-['JetBrains_Mono'] text-slate-800 outline-hidden transition-colors focus:border-sky-500"
              />
            </div>

            <div className="space-y-3 border-t border-stone-200 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Hız</label>
                <span className="rounded-md border border-stone-300 bg-stone-50 px-2 py-1 text-[10px] font-bold font-['JetBrains_Mono'] text-slate-900">
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
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-slate-800"
              />

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${isPlaying
                  ? 'border-stone-300 bg-white text-slate-800 hover:bg-stone-50'
                  : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[9px]`}></i>
                {isPlaying ? 'Durdur' : 'Başlat'}
              </button>
            </div>

            <div className="border-t border-stone-200 pt-3">
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
}

function MatrixToggle({ icon, label, checked, onChange, activeColor }: MatrixToggleProps) {
  return (
    <label
      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-2 transition-colors ${checked
        ? 'border-sky-200 bg-sky-50/70'
        : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${checked ? activeColor : 'border border-stone-300 bg-stone-100 text-stone-500'}`}>
          <i className={`fa-solid ${icon} text-[12px]`}></i>
        </div>
        <span className={`text-[10px] font-bold leading-tight transition-colors ${checked ? 'text-slate-900' : 'text-slate-600'}`}>
          {label}
        </span>
      </div>

      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <div className="h-4 w-9 rounded-full bg-stone-300 transition-colors peer-checked:bg-slate-900 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"></div>
      </div>
    </label>
  )
}
