import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

import { formatDateForInput } from '../../../utils/dateUtils'
import { useAstroStore } from '../stores/useAstroStore'

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

  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setInputValue(formatDateForInput(currentDate))
  }, [currentDate])

  if (!isEnabled) return null

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value)
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="fixed top-20 right-4 z-[10002] w-[240px] font-['Outfit']"
      >
        {/* Enterprise Light Container - Compact */}
        <div className="relative overflow-hidden bg-white rounded-[24px] border border-zinc-200 shadow-[0_15px_30px_rgba(0,0,0,0.1)]">

          {/* Header: Clean & Technical */}
          <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <i className="fa-solid fa-satellite-dish text-emerald-600 text-[12px]"></i>
              </div>
              <div>
                <h3 className="text-zinc-900 text-[11px] font-bold tracking-tight">Astronomi Veri Paneli</h3>
                {isPlaying && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.2 h-1.2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] font-bold text-emerald-600/80 uppercase">Canlı İzleme</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex bg-zinc-100 rounded-full p-0.5 border border-zinc-200">
              {['local', 'utc'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTimeMode(mode as 'local' | 'utc')}
                  className={`px-2 py-0.5 text-[8px] font-bold rounded-full transition-all duration-300 ${timeMode === mode
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Zaman Modülü */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Zaman Dilimi</label>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  ŞİMDİ
                </button>
              </div>
              <div className="relative group">
                <input
                  type="datetime-local"
                  value={inputValue}
                  onChange={handleDateChange}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 text-[10px] font-['JetBrains_Mono'] text-zinc-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 outline-none transition-all"
                />
              </div>
            </div>

            {/* Hız Modülü */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Hız</label>
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-zinc-900 bg-white border border-zinc-100 px-1.5 py-0.5 rounded shadow-sm">
                  {speed.toFixed(1)}x
                </span>
              </div>

              <div className="relative h-4 flex items-center px-0.5">
                <input
                  type="range"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md ${isPlaying
                  ? 'bg-zinc-800 text-white hover:bg-zinc-900 shadow-zinc-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                }`}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-[9px]`}></i>
                {isPlaying ? 'DURDUR' : 'BAŞLAT'}
              </motion.button>
            </div>

            {/* Katman Matrisi */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="grid grid-cols-1 gap-1.5">
                <MatrixToggle
                  icon="fa-sun"
                  label="Güneş Konumu"
                  checked={features.sunPosition}
                  onChange={() => toggleFeature('sunPosition')}
                  activeColor="text-amber-500 bg-amber-50"
                />
                <MatrixToggle
                  icon="fa-circle-half-stroke"
                  label="Aydınlanma Çizgisi"
                  checked={features.terminator}
                  onChange={() => toggleFeature('terminator')}
                  activeColor="text-indigo-500 bg-indigo-50"
                />
                <MatrixToggle
                  icon="fa-moon"
                  label="Ay Evreleri"
                  checked={features.moonPhase}
                  onChange={() => toggleFeature('moonPhase')}
                  activeColor="text-slate-600 bg-slate-50"
                />
                <MatrixToggle
                  icon="fa-earth-americas"
                  label="Eksen Eğikliği"
                  checked={features.axialTilt}
                  onChange={() => toggleFeature('axialTilt')}
                  activeColor="text-emerald-500 bg-emerald-50"
                />
                <MatrixToggle
                  icon="fa-cloud-moon"
                  label="Tutulma Analizi"
                  checked={features.eclipses}
                  onChange={() => toggleFeature('eclipses')}
                  activeColor="text-rose-500 bg-rose-50"
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
    <label className={`flex items-center justify-between p-2 rounded-[14px] cursor-pointer transition-all border group ${checked
      ? 'border-emerald-200 bg-emerald-50/10'
      : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50/50'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all group-hover:scale-105 ${checked ? activeColor : 'text-zinc-400 bg-zinc-100 border border-zinc-200'}`}>
          <i className={`fa-solid ${icon} text-[12px]`}></i>
        </div>
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold transition-colors leading-tight ${checked ? 'text-zinc-900' : 'text-zinc-600'}`}>
            {label}
          </span>
        </div>
      </div>
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-8 h-4 bg-zinc-200 rounded-full peer peer-checked:bg-emerald-600/20 transition-all peer-checked:after:translate-x-[16px] peer-checked:after:bg-emerald-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-zinc-400 after:rounded-full after:h-2.5 after:w-2.5 after:transition-all"></div>
      </div>
    </label>
  )
}
