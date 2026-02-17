import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { formatDateForInput } from '../../../utils/dateUtils'
import { useAstroStore } from '../stores/useAstroStore'

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
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1220] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between border-b border-slate-700 bg-[#111a2b] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/10">
                <i className="fa-solid fa-satellite-dish text-[12px] text-cyan-300"></i>
              </div>
              <div>
                <h3 className="text-[12px] font-bold tracking-tight text-slate-100">Astronomi Veri Paneli</h3>
                {isPlaying && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"></span>
                    <span className="text-[8px] font-bold uppercase text-cyan-300">Canlı İzleme</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex rounded-lg border border-slate-600 bg-slate-900 p-0.5">
              {['local', 'utc'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeMode(mode as 'local' | 'utc')}
                  className={`rounded-md px-2.5 py-1 text-[9px] font-bold transition-colors ${timeMode === mode
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
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
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Zaman</label>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold transition-colors ${isNowSelected
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
                    : 'border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
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
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-[11px] font-['JetBrains_Mono'] text-slate-100 outline-hidden transition-colors focus:border-cyan-400"
              />
            </div>

            <div className="space-y-3 border-t border-slate-700 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Hız</label>
                <span className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-[10px] font-bold font-['JetBrains_Mono'] text-slate-100">
                  {speed.toFixed(1)}x
                </span>
              </div>

              <input
                type="range"
                min="0.1"
                max="1000"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400"
              />

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${isPlaying
                  ? 'border-slate-500 bg-slate-700 text-slate-100 hover:bg-slate-600'
                  : 'border-cyan-400/40 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                }`}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[9px]`}></i>
                {isPlaying ? 'Durdur' : 'Başlat'}
              </button>
            </div>

            <div className="border-t border-slate-700 pt-3">
              <div className="grid grid-cols-1 gap-1.5">
                <MatrixToggle
                  icon="fa-sun"
                  label="Güneş Konumu"
                  checked={features.sunPosition}
                  onChange={() => toggleFeature('sunPosition')}
                  activeColor="text-amber-300 bg-amber-500/15"
                />
                <MatrixToggle
                  icon="fa-circle-half-stroke"
                  label="Aydınlanma Çizgisi"
                  checked={features.terminator}
                  onChange={() => toggleFeature('terminator')}
                  activeColor="text-violet-300 bg-violet-500/15"
                />
                <MatrixToggle
                  icon="fa-moon"
                  label="Ay Evreleri"
                  checked={features.moonPhase}
                  onChange={() => toggleFeature('moonPhase')}
                  activeColor="text-slate-200 bg-slate-500/15"
                />
                <MatrixToggle
                  icon="fa-earth-americas"
                  label="Eksen Eğikliği"
                  checked={features.axialTilt}
                  onChange={() => toggleFeature('axialTilt')}
                  activeColor="text-cyan-300 bg-cyan-500/15"
                />
                <MatrixToggle
                  icon="fa-cloud-moon"
                  label="Tutulma Analizi"
                  checked={features.eclipses}
                  onChange={() => toggleFeature('eclipses')}
                  activeColor="text-rose-300 bg-rose-500/15"
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
        ? 'border-cyan-400/40 bg-cyan-500/10'
        : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${checked ? activeColor : 'border border-slate-600 bg-slate-800 text-slate-400'}`}>
          <i className={`fa-solid ${icon} text-[12px]`}></i>
        </div>
        <span className={`text-[10px] font-bold leading-tight transition-colors ${checked ? 'text-slate-100' : 'text-slate-300'}`}>
          {label}
        </span>
      </div>

      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <div className="h-4 w-9 rounded-full bg-slate-600 transition-colors peer-checked:bg-cyan-400 after:absolute after:left-[2px] after:top-[2px] after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"></div>
      </div>
    </label>
  )
}

