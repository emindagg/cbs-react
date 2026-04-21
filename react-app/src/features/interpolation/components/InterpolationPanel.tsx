import { getRampColors } from '../services/InterpolationRenderer'
import { isClassifySupported } from '../services/symbologyConstraints'
import type {
  InterpolationColorRamp,
  InterpolationConfig,
  InterpolationGridType,
  InterpolationMethod,
  InterpolationSymbology,
} from '../types'

interface InterpolationPanelProps {
  isActive: boolean
  isPanelOpen: boolean
  config: InterpolationConfig
  isProcessing: boolean
  error: string | null
  numericColumns: string[]
  pointCount: number
  hasData: boolean
  setConfig: (partial: Partial<InterpolationConfig>) => void
  setPanelOpen: (open: boolean) => void
  runInterpolation: () => void | Promise<void>
  deactivate: () => void
}

const COLOR_RAMP_OPTIONS: { value: InterpolationColorRamp; label: string }[] = [
  { value: 'spectral', label: 'Mavi-Kırmızı' },
  { value: 'spectral-reverse', label: 'Kırmızı-Mavi' },
  { value: 'green-red', label: 'Yeşil-Kırmızı' },
  { value: 'red-green', label: 'Kırmızı-Yeşil' },
  { value: 'viridis', label: 'Viridis' },
  { value: 'magma', label: 'Magma' },
  { value: 'terrain', label: 'Arazi' },
  { value: 'blues', label: 'Mavi Tonları' },
  { value: 'reds', label: 'Kırmızı Tonları' },
]

const GRID_OPTIONS: { value: InterpolationGridType; label: string }[] = [
  { value: 'smooth', label: 'Pürüzsüz' },
  { value: 'isoband', label: 'Eş Değer Alanlar' },
  { value: 'square', label: 'Kare' },
  { value: 'hex', label: 'Altıgen' },
  { value: 'triangle', label: 'Üçgen' },
]

const SYMBOLOGY_OPTIONS: { value: InterpolationSymbology; label: string }[] = [
  { value: 'stretch', label: 'Sürekli' },
  { value: 'classify', label: 'Sınıflandırılmış' },
]

export default function InterpolationPanel({
  isActive,
  isPanelOpen,
  config,
  isProcessing,
  error,
  numericColumns,
  pointCount,
  hasData,
  setConfig,
  setPanelOpen,
  runInterpolation,
  deactivate,
}: InterpolationPanelProps) {
  if (!isActive || !isPanelOpen) return null

  const canRun = hasData && pointCount >= 3 && !!config.valueColumn && !isProcessing
  const rampPreview = getRampColors(config.colorRamp, 7)

  return (
    <div className="fixed top-14 right-14 z-1500 w-72 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-zinc-50 to-zinc-100 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-bold text-zinc-800">Enterpolasyon</h3>
          <p className="text-[8px] text-zinc-500">
            {hasData ? `${pointCount} nokta` : 'Veri yok'}
          </p>
        </div>
        <button
          onClick={() => setPanelOpen(false)}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
        >
          <i className="fa-solid fa-xmark text-[10px]"></i>
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {!hasData ? (
          <div className="px-3.5 py-6 text-center">
            <i className="fa-solid fa-file-import text-zinc-300 text-2xl mb-2"></i>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Enterpolasyon için veri içe aktarın
            </p>
          </div>
        ) : numericColumns.length === 0 ? (
          <div className="px-3.5 py-6 text-center">
            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-2xl mb-2"></i>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Sayısal sütun bulunamadı
            </p>
          </div>
        ) : (
          <div className="px-3.5 py-3 space-y-3">
            {/* Value Column */}
            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Değer Sütunu
              </label>
              <select
                value={config.valueColumn}
                onChange={(e) => setConfig({ valueColumn: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 text-[11px] text-zinc-700 focus:outline-none focus:border-zinc-700"
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Method */}
            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Yöntem
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['idw', 'kriging'] as InterpolationMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setConfig({ method: m })}
                    className={`text-[10px] font-medium py-1.5 rounded-md transition-colors ${config.method === m
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {m === 'idw' ? 'IDW' : 'Kriging'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Type */}
            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Görünüm Tipi
              </label>
              <select
                value={config.gridType}
                onChange={(e) => setConfig({ gridType: e.target.value as InterpolationGridType })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 text-[11px] text-zinc-700 focus:outline-none focus:border-zinc-700"
              >
                {GRID_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Color Ramp */}
            <div>
              <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Renk Skalası
              </label>
              <select
                value={config.colorRamp}
                onChange={(e) => setConfig({ colorRamp: e.target.value as InterpolationColorRamp })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 text-[11px] text-zinc-700 focus:outline-none focus:border-zinc-700"
              >
                {COLOR_RAMP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div
                className="mt-1.5 h-2 rounded-full"
                style={{ background: `linear-gradient(to right, ${rampPreview.join(',')})` }}
              />
            </div>

            {/* Symbology (Görünüm) — pürüzsüz modda anlamsız (her zaman sürekli renk) */}
            {isClassifySupported(config.gridType) && (
              <div>
                <label className="block text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  Semboloji (Görünüm)
                </label>
                <select
                  value={config.symbology}
                  onChange={(e) => setConfig({ symbology: e.target.value as InterpolationSymbology })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 text-[11px] text-zinc-700 focus:outline-none focus:border-zinc-700"
                >
                  {SYMBOLOGY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Class Count (Symbology=classify ve smooth değilken gösterilir) */}
            {isClassifySupported(config.gridType) && config.symbology === 'classify' && (
              <SliderRow
                label="Sınıf Sayısı"
                value={config.classCount}
                min={3}
                max={15}
                step={1}
                onChange={(v) => setConfig({ classCount: v })}
              />
            )}

            {/* Cell Width — pürüzsüz modda anlamsız (raster çözünürlüğü otomatik) */}
            {config.gridType !== 'smooth' && (
              <SliderRow
                label="Hücre Genişliği (km)"
                value={config.cellWidth}
                min={1}
                max={50}
                step={1}
                onChange={(v) => setConfig({ cellWidth: v })}
              />
            )}

            {/* IDW Power */}
            {config.method === 'idw' && (
              <SliderRow
                label="Mesafe Duyarlılığı"
                value={config.idwPower}
                min={0.5}
                max={5}
                step={0.5}
                onChange={(v) => setConfig({ idwPower: v })}
              />
            )}

            {/* Fill Opacity */}
            <SliderRow
              label="Görünürlük"
              value={config.fillOpacity}
              min={0.1}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setConfig({ fillOpacity: v })}
            />

            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-2">
              <div className="text-[10px] text-zinc-700 font-medium">Değerleri Haritada Göster</div>
              <button
                type="button"
                onClick={() => setConfig({ showPointValues: !config.showPointValues })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.showPointValues ? 'bg-zinc-900' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.showPointValues ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Run Button */}
            <button
              onClick={() => { void runInterpolation() }}
              disabled={!canRun}
              className={`w-full text-[11px] font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 ${canRun
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
                  Hesaplanıyor...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-play text-[9px]"></i>
                  Analizi Başlat
                </>
              )}
            </button>

            {error && (
              <div className="bg-red-50 text-red-700 text-[10px] px-2.5 py-2 rounded-md leading-relaxed">
                <i className="fa-solid fa-circle-exclamation mr-1"></i>
                {error}
              </div>
            )}

            {/* Info */}
            <div className="text-[9px] bg-zinc-100 text-zinc-700 px-2.5 py-2 rounded-md leading-relaxed">
              <i className="fa-solid fa-circle-info mr-1"></i>
              {config.method === 'idw'
                ? 'IDW: Noktaların değerlerini mesafeye göre ağırlıklandırır.'
                : 'Kriging: Variogram tabanlı jeoistatistiksel enterpolasyon.'}
            </div>

            {/* Deactivate */}
            <button
              onClick={deactivate}
              className="w-full text-[10px] font-medium py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 text-zinc-900 bg-zinc-100 hover:bg-zinc-200"
            >
              <i className="fa-solid fa-power-off text-[9px]"></i>
              Analizi Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format?: (v: number) => string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[9px] text-zinc-600 font-mono bg-zinc-50 px-1.5 py-0.5 rounded">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
      />
    </div>
  )
}
