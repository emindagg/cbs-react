import { useCallback } from 'react'

import type { HeatmapPreset } from '../types'

interface HeatmapPanelProps {
  isOpen: boolean
  config: {
    radius: number
    intensity: number
    opacity: number
    weightField: string | null
  }
  numericFields: string[]
  pointCount: number
  hasData: boolean
  onConfigChange: (config: Partial<HeatmapPanelProps['config']>) => void
  onPreset: (preset: HeatmapPreset) => void
  onClose: () => void
  onDeactivate: () => void
}

const PRESETS: { id: HeatmapPreset; label: string; gradient: string }[] = [
  { id: 'classic', label: 'Klasik', gradient: 'from-blue-500 via-yellow-300 to-red-600' },
  { id: 'warm', label: 'Sıcak', gradient: 'from-red-900 via-orange-500 to-yellow-300' },
  { id: 'cool', label: 'Soğuk', gradient: 'from-teal-700 via-cyan-400 to-lime-200' },
  { id: 'monochrome', label: 'Mono', gradient: 'from-zinc-900 via-zinc-400 to-white' },
]

export default function HeatmapPanel({
  isOpen,
  config,
  numericFields,
  pointCount,
  hasData,
  onConfigChange,
  onPreset,
  onClose,
  onDeactivate,
}: HeatmapPanelProps) {
  const handleRadiusChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ radius: Number(e.target.value) })
  }, [onConfigChange])

  const handleIntensityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ intensity: Number(e.target.value) })
  }, [onConfigChange])

  const handleOpacityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ opacity: Number(e.target.value) })
  }, [onConfigChange])

  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ weightField: e.target.value || null })
  }, [onConfigChange])

  if (!isOpen) return null

  return (
    <div className="fixed top-14 right-14 z-1500 w-64 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
            <i className="fa-solid fa-fire text-white text-[10px]"></i>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-zinc-800">Isı Haritası</h3>
            <p className="text-[8px] text-zinc-500">
              {hasData ? `${pointCount} veri noktası` : 'Veri yok'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>

      {!hasData ? (
        <div className="px-3.5 py-6 text-center">
          <i className="fa-solid fa-file-import text-zinc-300 text-2xl mb-2"></i>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Isı haritası oluşturmak için<br />önce nokta verisi içe aktarın.
          </p>
        </div>
      ) : (
        <div className="px-3.5 py-3 space-y-3">
          {/* Color Presets */}
          <div>
            <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Renk Şeması
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onPreset(preset.id)}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-zinc-50 transition-colors group"
                  title={preset.label}
                >
                  <div className={`w-full h-3 rounded-sm bg-gradient-to-r ${preset.gradient} ring-1 ring-zinc-200 group-hover:ring-zinc-300`} />
                  <span className="text-[8px] text-zinc-500 group-hover:text-zinc-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weight Field */}
          {numericFields.length > 0 && (
            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Ağırlık Alanı
              </label>
              <select
                value={config.weightField ?? ''}
                onChange={handleWeightChange}
                className="w-full text-[10px] border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-400 focus:border-red-400 bg-white"
              >
                <option value="">Eşit ağırlık (yok)</option>
                {numericFields.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              <p className="text-[8px] text-zinc-400 mt-0.5">Sayısal alan seçerek yoğunluk ağırlıklandırın</p>
            </div>
          )}

          {/* Radius */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Yarıçap
              </label>
              <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
                {config.radius}px
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={80}
              step={1}
              value={config.radius}
              onChange={handleRadiusChange}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Intensity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Yoğunluk
              </label>
              <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
                {config.intensity.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={config.intensity}
              onChange={handleIntensityChange}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
                Opaklık
              </label>
              <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
                {Math.round(config.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={config.opacity}
              onChange={handleOpacityChange}
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Deactivate Button */}
          <button
            onClick={onDeactivate}
            className="w-full text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-power-off text-[9px]"></i>
            Isı Haritasını Kapat
          </button>
        </div>
      )}
    </div>
  )
}
