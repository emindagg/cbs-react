/**
 * Bubble / symbol map ayarları (VizWizardStep3 içinde kullanılır)
 */

import { DualRangeSlider, SingleSlider } from '@/components/ui'
import type { BubbleSizeMode, ClassificationMethod, SymbolScaling, VisualizationSettings } from '@/types/visualization'

/* ── Dual-handle range slider sabitleri ── */
const SIZE_MIN = 2
const SIZE_MAX = 80

const SCALING_OPTIONS: { value: SymbolScaling; label: string; description: string }[] = [
  { value: 'sqrt', label: 'Karekök', description: 'Alan-orantılı (varsayılan)' },
  { value: 'log', label: 'Logaritmik', description: 'Geniş aralıklar için' },
]

const SIZE_MODE_OPTIONS: { value: BubbleSizeMode; label: string }[] = [
  { value: 'proportional', label: 'Oransal' },
  { value: 'graduated', label: 'Dereceli' },
]

const CLASSIFICATION_OPTIONS: { value: ClassificationMethod; label: string }[] = [
  { value: 'jenks', label: 'Doğal Kırılımlar (Jenks)' },
  { value: 'quantile', label: 'Quantile' },
  { value: 'equal', label: 'Eşit Aralık' },
]

interface BubbleSettingsProps {
  vizSettings: VisualizationSettings
  setVizSettings: (s: Partial<VisualizationSettings>) => void
  /** Bivariate seçimi için mevcut sütunlar */
  columns?: string[]
  /** Şu anki veri sütunu (boyut için) */
  dataColumn?: string
}

export function BubbleSettings({
  vizSettings,
  setVizSettings,
  columns,
  dataColumn,
}: BubbleSettingsProps) {
  // Bivariate: renk sütunu seçenekleri (veri sütunu hariç)
  const colorColumnOptions = columns?.filter((c) => c !== dataColumn) ?? []

  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-700 mb-2">
        Sembol Ayarları
      </div>

      {/* Size mode toggle: Oransal / Dereceli */}
      <div>
        <label className="block text-[10px] font-medium text-zinc-600 mb-1">
          Boyutlandırma Modu
        </label>
        <div className="flex rounded-md border border-zinc-200 overflow-hidden">
          {SIZE_MODE_OPTIONS.map((opt) => {
            const active = (vizSettings.bubbleSizeMode || 'proportional') === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVizSettings({ bubbleSizeMode: opt.value })}
                className={`flex-1 px-2 py-1 text-[10px] font-medium transition-colors ${active
                  ? 'bg-zinc-800 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Proportional: scaling method */}
      {(vizSettings.bubbleSizeMode || 'proportional') === 'proportional' && (
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Boyut Ölçekleme
          </label>
          <select
            value={vizSettings.symbolScaling || 'sqrt'}
            onChange={(e) => setVizSettings({ symbolScaling: e.target.value as SymbolScaling })}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {SCALING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} — {opt.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Non-bivariate: tek renk (Dolgu Rengi) */}
      {!vizSettings.colorColumn && (
        <>
          {/* Dolgu Rengi */}
          <div>
            <label className="block text-[10px] font-medium text-zinc-600 mb-1">Dolgu Rengi</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={vizSettings.symbolFillColor || '#4a90d9'}
                onChange={(e) => setVizSettings({ symbolFillColor: e.target.value })}
                className="w-12 h-8 border border-zinc-200 rounded cursor-pointer"
              />
              <input
                type="text"
                value={vizSettings.symbolFillColor || '#4a90d9'}
                onChange={(e) => {
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value))
                    setVizSettings({ symbolFillColor: e.target.value })
                }}
                placeholder="#4a90d9"
                className="flex-1 px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

        </>
      )}

      {/* Graduated: class count + classification method */}
      {vizSettings.bubbleSizeMode === 'graduated' && (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] font-medium text-zinc-600 mb-1">
              Sınıf Sayısı
            </label>
            <select
              value={vizSettings.classCount}
              onChange={(e) => setVizSettings({ classCount: Number(e.target.value) })}
              className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {[3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>{n} sınıf</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-zinc-600 mb-1">
              Sınıflandırma Yöntemi
            </label>
            <select
              value={vizSettings.classificationMethod}
              onChange={(e) => setVizSettings({ classificationMethod: e.target.value as ClassificationMethod })}
              className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CLASSIFICATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bivariate: color column selection */}
      {colorColumnOptions.length > 0 && (
        <div>
          <label className="block text-[10px] font-medium text-zinc-600 mb-1">
            Renk Sütunu
          </label>
          <select
            value={vizSettings.colorColumn || ''}
            onChange={(e) => setVizSettings({ colorColumn: e.target.value || undefined })}
            className="w-full px-2 py-1 text-[10px] border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Boyut ile aynı sütun</option>
            {colorColumnOptions.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <p className="text-[9px] text-zinc-400 mt-0.5">
            Farklı sütun seçerek boyut ve rengi ayrı verilerle gösterebilirsiniz.
          </p>
        </div>
      )}

      {/* Dual-handle boyut slider */}
      <DualRangeSlider
        label="Boyut Aralığı"
        min={SIZE_MIN}
        max={SIZE_MAX}
        valueMin={vizSettings.symbolMinSize ?? 5}
        valueMax={vizSettings.symbolMaxSize ?? 40}
        formatValue={(min, max) => `${min} – ${max} px`}
        onChangeMin={(v) => setVizSettings({ symbolMinSize: v })}
        onChangeMax={(v) => setVizSettings({ symbolMaxSize: v })}
      />

      {/* Kenar Kalınlığı slider */}
      <SingleSlider
        label="Kenar Kalınlığı"
        min={0}
        max={5}
        step={0.1}
        value={vizSettings.symbolStrokeWidth ?? 0.5}
        formatValue={(v) => v.toFixed(1)}
        onChange={(v) => setVizSettings({ symbolStrokeWidth: v })}
      />

      {/* Opaklık slider */}
      <SingleSlider
        label="Şeffaflık"
        min={0}
        max={1}
        step={0.05}
        value={vizSettings.symbolOpacity ?? 0.6}
        formatValue={(v) => `%${Math.round(v * 100)}`}
        onChange={(v) => setVizSettings({ symbolOpacity: v })}
      />

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
