/**
 * Wizard Step 4: Visualization Settings
 * Configure visualization settings and render
 */

import ColorSchemePreview from './ColorSchemePreview'
import { useVizRender } from './hooks/useVizRender'
import { useVizSuggestion } from './hooks/useVizSuggestion'
import { useMapStore } from '../../stores/useMapStore'
import { useVisualizationStore } from '../../stores/useVisualizationStore'
import type { ColorScheme, ClassificationMethod, VizType } from '../../types/visualization'

interface VizWizardStep4Props {
  onBack: () => void;
}

const VIZ_TYPES: { value: VizType; label: string; description: string }[] = [
  { value: 'choropleth', label: 'Koroplet Harita', description: 'Bölgeleri renklendirerek veriyi göster' },
  { value: 'bubble', label: 'Kabarcık Harita', description: 'Değeri daire boyutuyla göster' },
  { value: 'dot', label: 'Nokta Yoğunluk', description: 'Sabit boyutlu noktalarla göster' },
]

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'viridis', label: 'Viridis' },
  { value: 'topographic', label: 'Topografik' },
  { value: 'diverging_orange_blue', label: 'Turuncu-Mavi' },
  { value: 'greens', label: 'Yeşil Tonları' },
  { value: 'reds', label: 'Kırmızı Tonları' },
  { value: 'blues', label: 'Mavi Tonları' },
  { value: 'oranges', label: 'Turuncu Tonları' },
  { value: 'purples', label: 'Mor Tonları' },
]

const CLASSIFICATION_METHODS: { value: ClassificationMethod; label: string; description: string }[] = [
  {
    value: 'quantile',
    label: 'Yüzdelik (Quantile)',
    description: 'Her sınıfta eşit sayıda öğe',
  },
  { value: 'equal', label: 'Eşit Aralık (Equal)', description: 'Eşit genişlikte aralıklar' },
  {
    value: 'jenks',
    label: 'Doğal Kırılma (Jenks)',
    description: 'Verideki doğal grupları bulur',
  },
  {
    value: 'rounded-sm',
    label: 'Yuvarlanmış (Rounded)',
    description: 'Güzel yuvarlak sayılar (10, 20, 50...)',
  },
  { value: 'logarithmic', label: 'Logaritmik', description: 'Üstel dağılımlı veriler için' },
]

export default function VizWizardStep4({ onBack }: VizWizardStep4Props) {
  const { matchResults, columnMapping, vizSettings, setVizSettings } = useVisualizationStore()
  const { mapInstance: map } = useMapStore()

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

      {/* Smart Suggestion Panel - Compact */}
      {suggestion && showSuggestion && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-2">
          <div className="flex items-start gap-2">
            <div className="text-lg">{suggestion.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-blue-900 mb-1">
                {suggestion.reason}
              </p>
              {suggestion.warning && (
                <p className="text-[9px] text-blue-700 mb-1.5">
                  ⚠️ {suggestion.warning}
                </p>
              )}
              <div className="flex gap-1">
                <button
                  onClick={onApplySuggestion}
                  className="px-2 py-0.5 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-colors"
                >
                  <i className="fa-solid fa-check mr-1 text-[8px]"></i>
                  Uygula
                </button>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100 rounded-sm transition-colors"
                >
                  <i className="fa-solid fa-xmark mr-1 text-[8px]"></i>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class count selection */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">Sınıf Sayısı</label>
        <div className="flex gap-1.5">
          {[3, 4, 5, 6, 7].map((count) => (
            <button
              key={count}
              onClick={() => setVizSettings({ classCount: count })}
              className={`
                flex-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all
                ${vizSettings.classCount === count
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:border-slate-300 hover:bg-zinc-50'
                }
              `}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-400 mt-1">Veriyi kaç renkli bölgeye ayırmak istersiniz?</p>
      </div>

      {/* Classification method */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">Sınıflandırma</label>
        <select
          value={vizSettings.classificationMethod}
          onChange={(e) =>
            setVizSettings({
              classificationMethod: e.target.value as ClassificationMethod,
            })
          }
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          {CLASSIFICATION_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
        <p className="text-[9px] text-zinc-400 mt-1">
          {
            CLASSIFICATION_METHODS.find((m) => m.value === vizSettings.classificationMethod)
              ?.description
          }
        </p>
      </div>

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
