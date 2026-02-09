/**
 * Bubble / symbol map ayarları (VizWizardStep3 içinde kullanılır)
 */

import type { VisualizationSettings } from '@/types/visualization'

interface SymbolSettingsProps {
  vizSettings: VisualizationSettings
  setVizSettings: (s: Partial<VisualizationSettings>) => void
}

export function SymbolSettings({
  vizSettings,
  setVizSettings,
}: SymbolSettingsProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-700 mb-2">
        Sembol Ayarları
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Min Boyut
          </label>
          <input
            type="number"
            min="2"
            max="20"
            defaultValue={vizSettings.symbolMinSize ?? 5}
            onBlur={(e) => {
              const val = parseInt(e.target.value)
              const clamped = isNaN(val) ? 5 : Math.max(2, Math.min(20, val))
              e.target.value = String(clamped)
              setVizSettings({ symbolMinSize: clamped })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Max Boyut
          </label>
          <input
            type="number"
            min="20"
            max="80"
            defaultValue={vizSettings.symbolMaxSize ?? 40}
            onBlur={(e) => {
              const val = parseInt(e.target.value)
              const clamped = isNaN(val) ? 40 : Math.max(20, Math.min(80, val))
              e.target.value = String(clamped)
              setVizSettings({ symbolMaxSize: clamped })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Kenar Kalınlığı
          </label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.5"
            value={vizSettings.symbolStrokeWidth !== undefined ? vizSettings.symbolStrokeWidth : 1.5}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (val >= 0 && val <= 5) {
                setVizSettings({ symbolStrokeWidth: val })
              }
            }}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Opaklık
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={vizSettings.symbolOpacity !== undefined ? vizSettings.symbolOpacity : 0.6}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (val >= 0 && val <= 1) {
                setVizSettings({ symbolOpacity: val })
              }
            }}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-medium text-zinc-600 mb-1">
          Kenar Rengi
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={vizSettings.symbolStrokeColor || '#ffffff'}
            onChange={(e) => setVizSettings({ symbolStrokeColor: e.target.value })}
            className="w-12 h-8 border border-zinc-200 rounded cursor-pointer"
          />
          <input
            type="text"
            value={vizSettings.symbolStrokeColor || '#ffffff'}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                setVizSettings({ symbolStrokeColor: e.target.value })
              }
            }}
            placeholder="#ffffff"
            className="flex-1 px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </div>
      </div>
    </div>
  )
}
