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
  { value: 'topographic', label: 'Topographic' },
  { value: 'diverging_orange_blue', label: 'Diverging (Orange-Blue)' },
  { value: 'greens', label: 'Greens' },
  { value: 'reds', label: 'Reds' },
  { value: 'blues', label: 'Blues' },
  { value: 'oranges', label: 'Oranges' },
  { value: 'purples', label: 'Purples' },
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
    <div className="space-y-4">
      {/* Visualization type (only choropleth for now) */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">Görselleştirme Tipi</label>
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2">
          <p className="text-xs text-zinc-700">
            <i className="fa-solid fa-map mr-1 text-emerald-600"></i>
            <strong>Choropleth</strong> (Renkli Bölgeler)
          </p>
        </div>
      </div>

      {/* Class count */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">
          Sınıf Sayısı: {vizSettings.classCount}
        </label>
        <input
          type="range"
          min="3"
          max="7"
          value={vizSettings.classCount}
          onChange={(e) =>
            setVizSettings({ classCount: parseInt(e.target.value) })
          }
          className="w-full"
        />
        <p className="text-xs text-zinc-500 mt-1">3-7 sınıf arasında seçin</p>
      </div>

      {/* Smart Suggestion Panel */}
      {suggestion && showSuggestion && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-2xl">{suggestion.emoji}</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-900 mb-1">
                💡 Önerilen Yöntem: {suggestion.reason}
              </p>
              {suggestion.warning && (
                <p className="text-xs text-blue-800 mb-2">
                  ⚠️ {suggestion.warning}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApplySuggestion}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  <i className="fa-solid fa-check mr-1"></i>
                  Uygula
                </button>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                >
                  <i className="fa-solid fa-times mr-1"></i>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classification method */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">Sınıflandırma Yöntemi</label>
        <select
          value={vizSettings.classificationMethod}
          onChange={(e) =>
            setVizSettings({
              classificationMethod: e.target.value as ClassificationMethod,
            })
          }
          className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {CLASSIFICATION_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          {
            CLASSIFICATION_METHODS.find((m) => m.value === vizSettings.classificationMethod)
              ?.description
          }
        </p>
      </div>

      {/* Color scheme */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">Renk Şeması</label>
        <select
          value={vizSettings.colorScheme}
          onChange={(e) =>
            setVizSettings({ colorScheme: e.target.value as ColorScheme })
          }
          className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {COLOR_SCHEMES.map((scheme) => (
            <option key={scheme.value} value={scheme.value}>
              {scheme.label}
            </option>
          ))}
        </select>
        <ColorSchemePreview colorScheme={vizSettings.colorScheme} />
      </div>

      {/* Render button */}
      <div className="pt-2">
        <button
          onClick={handleRender}
          disabled={isRendering}
          className="w-full px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRendering ? (
            <>
              <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
              Görselleştiriliyor...
            </>
          ) : hasRendered ? (
            <>
              <i className="fa-solid fa-rotate mr-1"></i>
              Yeniden Görselleştir
            </>
          ) : (
            <>
              <i className="fa-solid fa-eye mr-1"></i>
              Görselleştir
            </>
          )}
        </button>
      </div>

      {/* Success message */}
      {hasRendered && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <i className="fa-solid fa-check-circle mr-1"></i>
            Görselleştirme tamamlandı! Ayarları değiştirip tekrar görselleştirebilirsiniz.
          </p>
        </div>
      )}

      {/* Back button */}
      <div className="pt-2">
        <button
          onClick={onBack}
          className="w-full px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-1"></i>
          Geri
        </button>
      </div>
    </div>
  );
}
