import { useCallback, useState } from 'react'

import type { HeatmapPreset } from '../types'

interface HeatmapPanelProps {
  isOpen: boolean
  config: {
    radius: number
    intensity: number
    opacity: number
    weightField: string | null
  }
  activePreset: HeatmapPreset
  numericFields: string[]
  pointCount: number
  hasData: boolean
  onConfigChange: (config: Partial<HeatmapPanelProps['config']>) => void
  onPreset: (preset: HeatmapPreset) => void
  onClose: () => void
  onDeactivate: () => void
}

const PRESET_OPTIONS: { id: HeatmapPreset; label: string; colors: string[] }[] = [
  { id: 'classic', label: 'Klasik (Mavi-Kırmızı)', colors: ['#2166ac', '#67a9cf', '#d1e5f0', '#fddbc7', '#ef8a62', '#b2182b'] },
  { id: 'inferno', label: 'Inferno', colors: ['#000004', '#280b54', '#65156e', '#ba3655', '#f98d0a', '#fcffa4'] },
  { id: 'viridis', label: 'Viridis', colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#bde326', '#fde725'] },
  { id: 'magma', label: 'Magma', colors: ['#000004', '#1c1044', '#4f127b', '#b63679', '#fb8861', '#fcfdbf'] },
  { id: 'warm', label: 'Sıcak (Kırmızı-Sarı)', colors: ['#800026', '#bd0026', '#f03b20', '#fd8d3c', '#feb24c', '#fed976'] },
  { id: 'cool', label: 'Soğuk (Teal-Yeşil)', colors: ['#008080', '#00c8c8', '#64e6c8', '#b4ffb4', '#e6ffe6', '#ffffc8'] },
  { id: 'ocean', label: 'Okyanus', colors: ['#00204c', '#005596', '#1e90c8', '#64c8e6', '#c8f0ff', '#e8f8ff'] },
  { id: 'forest', label: 'Orman', colors: ['#00300e', '#105e1d', '#31a354', '#78c679', '#d9f0a3', '#f7fcb1'] },
  { id: 'sunset', label: 'Gün Batımı', colors: ['#5e1780', '#ab3764', '#e55934', '#fda700', '#feae5a', '#fee65a'] },
  { id: 'monochrome', label: 'Mono (Siyah-Beyaz)', colors: ['#1e1e1e', '#505050', '#8c8c8c', '#c8c8c8', '#e6e6e6', '#ffffff'] },
]

export default function HeatmapPanel({
  isOpen,
  config,
  activePreset,
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

  const handlePresetChange = useCallback((preset: HeatmapPreset) => {
    onPreset(preset)
    setPaletteOpen(false)
  }, [onPreset])

  const [isPaletteOpen, setPaletteOpen] = useState(false)

  if (!isOpen) return null

  const activeOption = PRESET_OPTIONS.find((p) => p.id === activePreset)

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
          {/* Color Palette Picker */}
          <div>
            <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Renk Paleti
            </label>
            <div className="relative">
              <button
                onClick={() => setPaletteOpen((v) => !v)}
                className="w-full border border-zinc-200 rounded-md px-2 py-1.5 bg-white flex items-center justify-between gap-2 hover:border-zinc-300 transition-colors focus:outline-hidden focus:ring-1 focus:ring-red-400"
              >
                {activeOption && (
                  <div
                    className="flex-1 h-4 rounded-sm"
                    style={{ background: `linear-gradient(to right, ${activeOption.colors.join(', ')})` }}
                  />
                )}
                <i className={`fa-solid fa-chevron-down text-[8px] text-zinc-400 transition-transform ${isPaletteOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {isPaletteOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-10 p-1.5 space-y-1 max-h-48 overflow-y-auto">
                  {PRESET_OPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={`w-full h-5 rounded-sm transition-all ${activePreset === preset.id ? 'ring-2 ring-red-400 ring-offset-1' : 'hover:ring-1 hover:ring-zinc-300 hover:ring-offset-1'}`}
                      style={{ background: `linear-gradient(to right, ${preset.colors.join(', ')})` }}
                    />
                  ))}
                </div>
              )}
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
