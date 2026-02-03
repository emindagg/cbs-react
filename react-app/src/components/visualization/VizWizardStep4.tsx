/**
 * Wizard Step 4: Visualization Settings
 * Configure visualization settings and render
 */

import { useState, useEffect } from 'react';
import { useVisualizationStore } from '../../stores/useVisualizationStore';
import { useMapStore } from '../../stores/useMapStore';
import { VisualizationManager } from '../../services/VisualizationManager';
import ColorSchemePreview from './ColorSchemePreview';
import { suggestClassificationMethod } from '../../utils/classificationMethods';
import type { ColorScheme, ClassificationMethod } from '../../types/visualization';

interface VizWizardStep4Props {
  onBack: () => void;
}

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'viridis', label: 'Viridis' },
  { value: 'topographic', label: 'Topografik' },
  { value: 'diverging_orange_blue', label: 'Turuncu-Mavi' },
  { value: 'greens', label: 'Yeşil Tonları' },
  { value: 'reds', label: 'Kırmızı Tonları' },
  { value: 'blues', label: 'Mavi Tonları' },
  { value: 'oranges', label: 'Turuncu Tonları' },
  { value: 'purples', label: 'Mor Tonları' },
];

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
    value: 'rounded',
    label: 'Yuvarlanmış (Rounded)',
    description: 'Güzel yuvarlak sayılar (10, 20, 50...)',
  },
  { value: 'logarithmic', label: 'Logaritmik', description: 'Üstel dağılımlı veriler için' },
];

export default function VizWizardStep4({ onBack }: VizWizardStep4Props) {
  const [isRendering, setIsRendering] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    method: ClassificationMethod;
    reason: string;
    emoji: string;
    warning?: string;
  } | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(true);

  const { matchResults, columnMapping, vizSettings, setVizSettings } = useVisualizationStore();
  const { mapInstance: map } = useMapStore();

  // Calculate suggestion when data changes
  useEffect(() => {
    if (!matchResults.successful.length || !columnMapping.dataColumn) {
      setSuggestion(null);
      return;
    }

    try {
      // Extract values from successful matches
      const values = matchResults.successful
        .map((m) => parseFloat(m.originalData[columnMapping.dataColumn!]))
        .filter((v) => !isNaN(v) && v !== 0);

      if (values.length === 0) {
        setSuggestion(null);
        return;
      }

      // Get suggestion
      const methodSuggestion = suggestClassificationMethod(values);
      setSuggestion(methodSuggestion);
      setShowSuggestion(true);
    } catch (error) {
      console.error('Suggestion calculation error:', error);
      setSuggestion(null);
    }
  }, [matchResults, columnMapping.dataColumn]);

  const handleApplySuggestion = () => {
    if (suggestion) {
      setVizSettings({ classificationMethod: suggestion.method });
      setShowSuggestion(false);
    }
  };

  const handleRender = async () => {
    if (!map) {
      alert('Harita bulunamadı!');
      return;
    }

    setIsRendering(true);

    try {
      const vizManager = new VisualizationManager(map);

      // Get successful matches only
      const successfulData = matchResults.successful.map((m) => ({
        location: m.location,
        province: m.province,
        district: m.district,
        ...m.originalData,
      }));

      if (successfulData.length === 0) {
        alert('Görselleştirilecek veri yok!');
        return;
      }

      // Render choropleth
      await vizManager.renderChoropleth(
        successfulData,
        columnMapping.dataColumn!,
        vizSettings,
        columnMapping.locationLevel === 'province' ? 'province' : 'district'
      );

      setHasRendered(true);
    } catch (error: any) {
      console.error('Render error:', error);
      alert('Görselleştirme hatası: ' + error.message);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Visualization type badge */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded text-[10px] text-emerald-700">
        <i className="fa-solid fa-map text-[9px]"></i>
        <span className="font-medium">Choropleth Map</span>
      </div>

      {/* Smart Suggestion Panel - Compact */}
      {suggestion && showSuggestion && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-2">
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
                  onClick={handleApplySuggestion}
                  className="px-2 py-0.5 text-[10px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  <i className="fa-solid fa-check mr-1 text-[8px]"></i>
                  Uygula
                </button>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors"
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
                  ? 'bg-slate-700 text-white shadow-sm'
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
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
          onClick={handleRender}
          disabled={isRendering}
          className="w-full px-3 py-2 text-[11px] font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
  );
}
