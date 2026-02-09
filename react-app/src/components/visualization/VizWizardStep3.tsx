/**
 * Wizard Step 3: Visualization Settings
 * Configure visualization settings and render (moved from old Step 4)
 */

import { useState } from 'react'

import ColorScaleConfig from './ColorScaleConfig'
import ColorSchemePreview from './ColorSchemePreview'
import CustomRangeConfig from './CustomRangeConfig'
import DataDistributionPreview from './DataDistributionPreview'
import LegendConfig from './LegendConfig'
import { useVizRender } from './hooks/useVizRender'
import { useVizSuggestion } from './hooks/useVizSuggestion'
import { useMapStore } from '../../stores/useMapStore'
import { useVisualizationStore } from '../../stores/useVisualizationStore'
import type { ColorScheme, ClassificationMethod, VizType } from '../../types/visualization'

interface VizWizardStep3Props {
  onBack: () => void;
}

const VIZ_TYPES: { value: VizType; label: string; description: string }[] = [
  { value: 'choropleth', label: 'Koroplet Harita', description: 'Bölgeleri renklendirerek veriyi göster' },
  { value: 'bubble', label: 'Kabarcık Harita', description: 'Değeri daire boyutuyla göster' },
  { value: 'dot', label: 'Nokta Yoğunluk', description: 'Sabit boyutlu noktalarla göster' },
]

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  // Original
  { value: 'viridis', label: 'Viridis' },

  // Datawrapper Sequential
  { value: 'greenBlue', label: 'Yeşil-Mavi' },
  { value: 'sunset', label: 'Gün Batımı' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'yellowGreen', label: 'Sarı-Yeşil' },
  { value: 'pinkPurple', label: 'Pembe-Mor' },
  { value: 'yellowBlue', label: 'Sarı-Mavi' },
  { value: 'rosePurple', label: 'Gül-Mor' },

  // Datawrapper Diverging
  { value: 'brownTeal', label: 'Kahve-Deniz' },
  { value: 'pinkGreen', label: 'Pembe-Yeşil' },
  { value: 'redBlue', label: 'Kırmızı-Mavi' },
  { value: 'redTeal', label: 'Kırmızı-Deniz' },
]

const CLASSIFICATION_METHODS: { value: ClassificationMethod; label: string; description: string }[] = [
  {
    value: 'jenks',
    label: 'Doğal Kırılmalar (Jenks)',
    description: 'Verideki doğal grupları bulur',
  },
  { value: 'equal', label: 'Doğrusal (Eşit Aralık)', description: 'Eşit genişlikte aralıklar' },
  {
    value: 'quantile',
    label: 'Çeyrekler (Eşit Sayı)',
    description: 'Her sınıfta eşit sayıda öğe',
  },
  {
    value: 'kmeans',
    label: 'K-Ortalamalar',
    description: 'Benzer değerleri otomatik gruplar',
  },
  {
    value: 'logarithmic',
    label: 'Logaritmik',
    description: 'Çok geniş değer aralıkları için logaritmik ölçekleme',
  },
  {
    value: 'rounded-sm',
    label: 'Yuvarlanmış Değerler',
    description: 'Güzel yuvarlak sayılar (10, 20, 50...)',
  },
  { value: 'custom', label: 'Özel Aralıklar', description: 'Özel aralıklar tanımla' },
]

export default function VizWizardStep3({ onBack }: VizWizardStep3Props) {
  const {
    matchResults,
    columnMapping,
    vizSettings,
    setVizSettings,
    colorConfig,
    setColorConfig,
    setCustomRange,
    setLegendConfig,
    mapTitle,
    setMapTitle,
  } = useVisualizationStore()
  const { mapInstance: map } = useMapStore()

  const [showDataPreview, setShowDataPreview] = useState(false)
  const [showLegendConfig, setShowLegendConfig] = useState(false)
  const [showMapTitleConfig, setShowMapTitleConfig] = useState(false)

  const {
    suggestion,
    showSuggestion,
    setShowSuggestion,
    handleApplySuggestion,
  } = useVizSuggestion({
    matchResults,
    dataColumn: columnMapping.dataColumn,
  })

  const { isRendering, hasRendered, handleRender } = useVizRender({
    matchResults,
    columnMapping,
    vizSettings,
    map,
  })

  // Extract values from match results for data preview
  const dataValues = matchResults.successful
    .map((result) => result.value)
    .filter((v): v is number => v !== undefined)

  const onApplySuggestion = () => {
    handleApplySuggestion((method) => {
      setVizSettings({ classificationMethod: method })
    })
  }

  return (
    <div className="space-y-3">
      {/* Visualization type selector */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
          Görselleştirme Türü
        </label>
        <select
          value={vizSettings.type}
          onChange={(e) =>
            setVizSettings({ type: e.target.value as VizType })
          }
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          {VIZ_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-[9px] text-zinc-400 mt-1">
          {VIZ_TYPES.find(t => t.value === vizSettings.type)?.description}
        </p>
      </div>

      {/* Datawrapper-style Color Scale Configuration */}
      <ColorScaleConfig
        colorScheme={vizSettings.colorScheme}
        classCount={vizSettings.classCount}
        scaleType={colorConfig.scaleType}
        interpolation={colorConfig.interpolation}
        onScaleTypeChange={(type) => {
          setColorConfig({ scaleType: type })
          if (type === 'continuous') {
            setVizSettings({ classificationMethod: 'continuous-linear' })
          } else {
            setVizSettings({ classificationMethod: 'equal' })
          }
        }}
        onInterpolationChange={(interpolation) => {
          setColorConfig({ interpolation })
          const methodMap: Record<string, ClassificationMethod> = {
            equidistant: 'continuous-linear',
            'quantiles-5': 'continuous-quantile',
            'quantiles-6': 'continuous-quantile',
            'quantiles-11': 'continuous-quantile',
            'natural-9': 'continuous-natural',
          }
          setVizSettings({ classificationMethod: methodMap[interpolation] || 'continuous-linear' })
        }}
      />

      {/* Color scheme */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">Renk Paleti</label>
        <select
          value={vizSettings.colorScheme}
          onChange={(e) =>
            setVizSettings({ colorScheme: e.target.value as ColorScheme })
          }
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          {COLOR_SCHEMES.map((scheme) => (
            <option key={scheme.value} value={scheme.value}>
              {scheme.label}
            </option>
          ))}
        </select>
        <ColorSchemePreview colorScheme={vizSettings.colorScheme} />
      </div>

      {/* Symbol Map Settings - only for bubble visualization */}
      {vizSettings.type === 'bubble' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
          <div className="text-[11px] font-semibold text-zinc-700 mb-2">
            Sembol Ayarları
          </div>

          {/* Size range */}
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

          {/* Stroke and opacity */}
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

          {/* Stroke color */}
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
      )}

      {/* Steps section - only for stepped scales */}
      {colorConfig.scaleType === 'steps' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="text-[11px] font-semibold text-zinc-700 min-w-[60px]">Basamak</label>
              <input
                type="number"
                min="3"
                max="9"
                value={vizSettings.classCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value)
                  if (count >= 3 && count <= 9) {
                    setVizSettings({ classCount: count })
                  }
                }}
                className="w-16 px-2 py-1.5 text-[11px] text-center border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <select
              value={vizSettings.classificationMethod}
              onChange={(e) =>
                setVizSettings({
                  classificationMethod: e.target.value as ClassificationMethod,
                })
              }
              className="w-full px-3 py-2 text-[11px] border border-zinc-200 rounded-md bg-white hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {CLASSIFICATION_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>

            <p className="text-[9px] text-zinc-500 mt-1.5 leading-relaxed">
              {CLASSIFICATION_METHODS.find((m) => m.value === vizSettings.classificationMethod)?.description}
            </p>
          </div>
        </div>
      )}

      {/* Smart Suggestion Panel */}
      {suggestion && showSuggestion && (
        <div className="suggestion-card">
          <div className="suggestion-card-inner">
            <span className="text-[8px] font-semibold text-indigo-500 uppercase tracking-wider">Akıllı Öneri</span>
            <p className="text-[11px] font-bold text-slate-900 tracking-tight leading-snug mt-0.5">
              {suggestion.reason}
            </p>
            {suggestion.warning && (
              <p className="text-[9px] text-slate-500 leading-relaxed mt-1">
                {suggestion.warning}
              </p>
            )}
            <p className="text-[9px] text-indigo-600 mt-1">
              {suggestion.reason} uygulamanız önerilir.
            </p>
            <div className="flex gap-1.5 mt-2">
              <button
                onClick={onApplySuggestion}
                className="suggestion-btn-apply px-2.5 py-0.5 text-[10px] font-semibold text-white bg-slate-900 rounded cursor-pointer"
              >
                Uygula
              </button>
              <button
                onClick={() => setShowSuggestion(false)}
                className="suggestion-btn-close px-2.5 py-0.5 text-[10px] font-medium text-red-400 bg-red-50 border border-red-200/60 rounded cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Range Configuration - Only for continuous scales */}
      {colorConfig.scaleType === 'continuous' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-3">
          <h4 className="text-[11px] font-semibold text-zinc-700 mb-2">Değer Aralığı</h4>
          <CustomRangeConfig
            customRange={colorConfig.customRange!}
            autoMin={dataValues.length > 0 ? Math.min(...dataValues) : 0}
            autoMax={dataValues.length > 0 ? Math.max(...dataValues) : 100}
            onChange={(range) => setCustomRange(range)}
          />
        </div>
      )}

      {/* Legend Configuration Panel */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <button
          onClick={() => setShowLegendConfig(!showLegendConfig)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-list text-[10px] text-zinc-500"></i>
            <span className="text-[11px] font-semibold text-zinc-700">Lejant Ayarları</span>
          </div>
          <i className={`fa-solid fa-chevron-${showLegendConfig ? 'up' : 'down'} text-[9px] text-zinc-400`}></i>
        </button>

        {showLegendConfig && (
          <div className="px-3 pb-3 pt-2 border-t border-zinc-100">
            <LegendConfig
              config={colorConfig.legend}
              onChange={(config) => setLegendConfig(config)}
            />
          </div>
        )}
      </div>

      {/* Map Title Configuration Panel */}
      <div className="bg-white border border-zinc-200 rounded-lg">
        <button
          onClick={() => setShowMapTitleConfig(!showMapTitleConfig)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-heading text-[10px] text-zinc-500"></i>
            <span className="text-[11px] font-semibold text-zinc-700">Harita Başlığı</span>
          </div>
          <i className={`fa-solid fa-chevron-${showMapTitleConfig ? 'up' : 'down'} text-[9px] text-zinc-400`}></i>
        </button>

        {showMapTitleConfig && (
          <div className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-3">
            {/* Show/Hide Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-600">Başlığı Göster</label>
              <button
                onClick={() => setMapTitle({ visible: !mapTitle.visible })}
                className={`
                  w-12 h-6 rounded-full transition-all relative
                  ${mapTitle.visible ? 'bg-blue-500' : 'bg-zinc-300'}
                `}
              >
                <div
                  className={`
                    w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all
                    ${mapTitle.visible ? 'left-6' : 'left-0.5'}
                  `}
                />
              </button>
            </div>

            {mapTitle.visible && (
              <>
                {/* Position */}
                <div>
                  <label className="text-[11px] font-medium text-zinc-600 mb-1.5 block">
                    Pozisyon
                  </label>
                  <select
                    value={mapTitle.position}
                    onChange={(e) => setMapTitle({ position: e.target.value as 'top-left' | 'top-center' | 'top-right' })}
                    className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-200 rounded bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="top-left">Sol Üst</option>
                    <option value="top-center">Orta Üst</option>
                    <option value="top-right">Sağ Üst</option>
                  </select>
                </div>

                {/* Font Size Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-zinc-600">Yazı Boyutu</label>
                    <span className="text-[10px] text-zinc-400">{mapTitle.fontSize || 24}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={55}
                      step={1}
                      value={mapTitle.fontSize || 24}
                      onChange={(e) => setMapTitle({ fontSize: Number.parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={5}
                      max={55}
                      value={mapTitle.fontSize || 24}
                      onChange={(e) => setMapTitle({ fontSize: Number.parseInt(e.target.value) })}
                      className="w-14 px-2 py-1 text-[10px] border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-[10px] text-blue-700">
                    💡 Başlığı düzenlemek için harita üzerinde tıklayın
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Data Distribution Preview Toggle */}
      {dataValues.length > 0 && (
        <div>
          <button
            onClick={() => setShowDataPreview(!showDataPreview)}
            className="w-full px-2.5 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center justify-center gap-1"
          >
            <i className={'fa-solid fa-chart-bar text-[9px]'}></i>
            {showDataPreview ? 'Veri Önizlemesini Gizle' : 'Veri Dağılımını Göster'}
          </button>
        </div>
      )}

      {/* Data Distribution Preview */}
      {showDataPreview && dataValues.length > 0 && (
        <DataDistributionPreview
          values={dataValues}
          colorScheme={vizSettings.colorScheme}
          classCount={vizSettings.classCount}
          classificationMethod={vizSettings.classificationMethod}
        />
      )}

      {/* Action buttons */}
      <div className="space-y-1.5 pt-1">
        {/* Render button */}
        <button
          onClick={() => handleRender()}
          disabled={isRendering}
          className="w-full px-3 py-2 text-[11px] font-semibold text-white bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {isRendering ? (
            <>
              <div className="inline-block animate-spin rounded-full h-2.5 w-2.5 border-2 border-white border-t-transparent mr-1.5"></div>
              Görselleştiriliyor...
            </>
          ) : hasRendered ? (
            <>
              <i className="fa-solid fa-arrows-rotate mr-1.5 text-[10px]"></i>
              Yeniden Görselleştir
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-[10px]"></i>
              Görselleştir
            </>
          )}
        </button>

        {/* Back button */}
        <button
          onClick={onBack}
          className="w-full px-3 py-1.5 text-[11px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
        >
          <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>
          Geri
        </button>
      </div>

      {/* Success message - Compact */}
      {hasRendered && (
        <div className="bg-emerald-50/50 rounded-md p-2 flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
          <p className="text-[10px] text-emerald-700">
            Tamamlandı! Ayarları değiştirip tekrar deneyebilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
}
