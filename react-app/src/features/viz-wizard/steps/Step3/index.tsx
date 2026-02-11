/**
 * Wizard Step 3: Visualization Settings
 * Configure visualization settings and render (moved from old Step 4)
 */

import { LegendConfig } from '@/features/legend-dw'
import type { ColorScheme, ClassificationMethod, VizType } from '@/types/visualization'

import { DotDensitySettings } from './components/DotDensitySettings'
import { MapTitleSection } from './components/MapTitleSection'
import { StepsSection } from './components/StepsSection'
import { SymbolSettings } from './components/SymbolSettings'
import { useVizWizardStep3 } from './useVizWizardStep3'
import {
  ColorScaleConfig,
  ColorSchemePreview,
  DataDistributionPreview,
} from '../../components/ColorScale'
import { CustomRangeConfig } from '../../components/CustomRange'

interface VizWizardStep3Props {
  onBack: () => void;
}

const VIZ_TYPES: { value: VizType; label: string; description: string }[] = [
  { value: 'choropleth', label: 'Koroplet Harita', description: 'Bölgeleri renklendirerek veriyi göster' },
  { value: 'bubble', label: 'Kabarcık Harita', description: 'Değeri daire boyutuyla göster' },
  { value: 'dot', label: 'Nokta Yoğunluk', description: 'Sabit boyutlu noktalarla göster' },
]

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  // Datawrapper Sequential
  { value: 'greenBlue', label: 'Yeşil-Mavi' },
  { value: 'viridis', label: 'Viridis' },
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

export default function VizWizardStep3({ onBack }: VizWizardStep3Props) {
  const step = useVizWizardStep3()
  const {
    vizSettings,
    setVizSettings,
    colorConfig,
    setColorConfig,
    setCustomRange,
    setLegendConfig,
    mapTitle,
    setMapTitle,
    showDataPreview,
    setShowDataPreview,
    showLegendConfig,
    setShowLegendConfig,
    showMapTitleConfig,
    setShowMapTitleConfig,
    suggestion,
    showSuggestion,
    setShowSuggestion,
    onApplySuggestion,
    isRendering,
    hasRendered,
    handleRender,
    dataValues,
  } = step

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

      {/* Datawrapper-style Color Scale Configuration — not needed for dot density */}
      {vizSettings.type !== 'dot' && (
        <>
          <ColorScaleConfig
            colorScheme={vizSettings.colorScheme}
            classCount={vizSettings.classCount}
            scaleType={colorConfig.scaleType}
            interpolation={colorConfig.interpolation}
            onScaleTypeChange={(type) => {
              setColorConfig({ scaleType: type })
              if (type === 'continuous') {
                setVizSettings({
                  classificationMethod: 'continuous-linear',
                  legendType: 'continuous',
                  interpolation: colorConfig.interpolation ?? 'equidistant',
                })
              } else {
                setVizSettings({
                  classificationMethod: 'equal',
                  legendType: 'discrete',
                })
              }
            }}
            onInterpolationChange={(interpolation) => {
              setColorConfig({ interpolation })
              const methodMap: Record<string, ClassificationMethod> = {
                equidistant: 'continuous-linear',
                'quantiles-4': 'continuous-quantile',
                'quantiles-5': 'continuous-quantile',
                'quantiles-10': 'continuous-quantile',
                'natural-9': 'continuous-natural',
              }
              setVizSettings({
                classificationMethod: methodMap[interpolation] || 'continuous-linear',
                interpolation,
              })
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
        </>
      )}

      {/* Symbol Map Settings - only for bubble visualization */}
      {vizSettings.type === 'bubble' && (
        <SymbolSettings vizSettings={vizSettings} setVizSettings={setVizSettings} />
      )}

      {/* Dot Density Settings - only for dot visualization */}
      {vizSettings.type === 'dot' && (
        <DotDensitySettings
          vizSettings={vizSettings}
          setVizSettings={(s) => setVizSettings(s)}
          dataValues={dataValues}
        />
      )}

      {/* Steps section - only for stepped scales, NOT for dot density */}
      {colorConfig.scaleType === 'steps' && vizSettings.type !== 'dot' && (
        <StepsSection
          classCount={vizSettings.classCount}
          classificationMethod={vizSettings.classificationMethod}
          customBreaks={vizSettings.customBreaks}
          setClassCount={(n) => setVizSettings({ classCount: n })}
          setClassificationMethod={(m) => setVizSettings({ classificationMethod: m })}
          setCustomBreaks={(breaks) => setVizSettings({ customBreaks: breaks, classCount: breaks.length - 1 })}
        />
      )}

      {/* Smart Suggestion Panel — not for dot density */}
      {vizSettings.type !== 'dot' && suggestion && showSuggestion && (
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

      {/* Custom Range Configuration */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3">
        <h4 className="text-[11px] font-semibold text-zinc-700 mb-2">Değer Aralığı</h4>
        <CustomRangeConfig
          customRange={colorConfig.customRange!}
          autoMin={dataValues.length > 0 ? Math.min(...dataValues) : 0}
          autoMax={dataValues.length > 0 ? Math.max(...dataValues) : 100}
          onChange={(range) => setCustomRange(range)}
        />
      </div>

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
              classCount={vizSettings.classCount}
            />
          </div>
        )}
      </div>

      {/* Map Title Configuration Panel */}
      <MapTitleSection
        mapTitle={mapTitle}
        setMapTitle={setMapTitle}
        expanded={showMapTitleConfig}
        onToggle={() => setShowMapTitleConfig(!showMapTitleConfig)}
      />

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
          interpolation={vizSettings.interpolation ?? colorConfig.interpolation}
          scaleType={colorConfig.scaleType}
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
