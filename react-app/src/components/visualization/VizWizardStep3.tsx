/**
 * Wizard Step 3: Match Results
 * Show matching results and resolve ambiguities
 */

import { useState, useEffect } from 'react';
import { useVisualizationStore } from '../../stores/useVisualizationStore';
import { useMapStore } from '../../stores/useMapStore';
import { VisualizationManager } from '../../services/VisualizationManager';
import { ColumnMapper } from '../../utils/columnMapper';
import MatchResultsTable from './MatchResultsTable';

interface VizWizardStep3Props {
  onBack: () => void;
  onNext: () => void;
}

export default function VizWizardStep3({ onBack, onNext }: VizWizardStep3Props) {
  const [isMatching, setIsMatching] = useState(false);
  const [hasMatched, setHasMatched] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const {
    rawData,
    columnMapping,
    matchResults,
    setMatchResults,
    provincesGeoJSON,
    districtsGeoJSON,
    setProvincesGeoJSON,
    setDistrictsGeoJSON,
    provinceIndex,
    districtIndex,
    setProvinceIndex,
    setDistrictIndex,
  } = useVisualizationStore();

  const { mapInstance: map } = useMapStore();

  useEffect(() => {
    if (!hasMatched) {
      performMatching();
    }
  }, []);

  const performMatching = async () => {
    console.log('🔍 performMatching called', { rawData: !!rawData, map: !!map });

    if (!rawData || !map) {
      console.warn('⚠️ Missing data:', { rawData: !!rawData, map: !!map });
      return;
    }

    setIsMatching(true);
    console.log('📊 Starting matching process...');

    try {
      // Create VisualizationManager
      const vizManager = new VisualizationManager(map);

      // Track indexes locally
      let localProvinceIndex = provinceIndex;
      let localDistrictIndex = districtIndex;

      // Load GeoJSON based on location level
      if (columnMapping.locationLevel === 'province') {
        if (!provincesGeoJSON) {
          const geojson = await vizManager.loadProvincesGeoJSON();
          setProvincesGeoJSON(geojson);
          const provIndex = vizManager.getProvinceIndex();
          if (provIndex) {
            setProvinceIndex(provIndex);
            localProvinceIndex = provIndex;
          }
        } else if (!localProvinceIndex) {
          // GeoJSON exists but index not loaded
          await vizManager.loadProvincesGeoJSON();
          const provIndex = vizManager.getProvinceIndex();
          if (provIndex) {
            setProvinceIndex(provIndex);
            localProvinceIndex = provIndex;
          }
        }
      } else if (
        columnMapping.locationLevel === 'district' ||
        columnMapping.locationLevel === 'mixed'
      ) {
        if (!districtsGeoJSON) {
          const geojson = await vizManager.loadDistrictsGeoJSON();
          setDistrictsGeoJSON(geojson);
          const distIndex = vizManager.getDistrictIndex();
          if (distIndex) {
            setDistrictIndex(distIndex);
            localDistrictIndex = distIndex;
          }
        } else if (!localDistrictIndex) {
          // GeoJSON exists but index not loaded
          await vizManager.loadDistrictsGeoJSON();
          const distIndex = vizManager.getDistrictIndex();
          if (distIndex) {
            setDistrictIndex(distIndex);
            localDistrictIndex = distIndex;
          }
        }

        if (columnMapping.locationLevel === 'mixed') {
          if (!provincesGeoJSON) {
            const geojson = await vizManager.loadProvincesGeoJSON();
            setProvincesGeoJSON(geojson);
            const provIndex = vizManager.getProvinceIndex();
            if (provIndex) {
              setProvinceIndex(provIndex);
              localProvinceIndex = provIndex;
            }
          } else if (!localProvinceIndex) {
            // GeoJSON exists but index not loaded
            await vizManager.loadProvincesGeoJSON();
            const provIndex = vizManager.getProvinceIndex();
            if (provIndex) {
              setProvinceIndex(provIndex);
              localProvinceIndex = provIndex;
            }
          }
        }
      }

      // Create ColumnMapper and perform matching
      const mapper = new ColumnMapper();
      mapper.rawData = rawData;
      mapper.columns = Object.keys(rawData[0]);
      mapper.setColumnMapping(columnMapping);
      mapper.setIndexes(localProvinceIndex, localDistrictIndex);

      console.log('🎯 Performing match with indexes:', {
        provinceIndex: !!localProvinceIndex,
        districtIndex: !!localDistrictIndex
      });

      const results = mapper.matchData();
      console.log('✅ Match results:', results);

      setMatchResults(results);
      setHasMatched(true);
    } catch (error: any) {
      console.error('❌ Matching error:', error);
      alert('Eşleştirme hatası: ' + error.message);
    } finally {
      setIsMatching(false);
      console.log('📍 Matching complete, hasMatched:', true);
    }
  };

  const handleNext = () => {
    if (matchResults.ambiguous.length > 0) {
      const proceed = confirm(
        `${matchResults.ambiguous.length} belirsiz eşleşme var. Bunlar görselleştirmede göz ardı edilecek. Devam edilsin mi?`
      );
      if (!proceed) return;
    }

    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Map not ready warning */}
      {!map && !isMatching && !hasMatched && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <i className="fa-solid fa-exclamation-triangle mr-1"></i>
            Harita henüz hazır değil. Lütfen bekleyin...
          </p>
        </div>
      )}

      {/* Manual trigger button if matching didn't start */}
      {!isMatching && !hasMatched && map && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800 mb-2">
            Otomatik eşleştirme başlamadı mı? Manuel olarak başlatın:
          </p>
          <button
            onClick={() => performMatching()}
            className="w-full px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-play mr-1"></i>
            Eşleştirmeyi Başlat
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isMatching && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-xs text-blue-700">Veri eşleştiriliyor...</p>
        </div>
      )}

      {/* Match results summary */}
      {!isMatching && hasMatched && (
        <>
          <div className="bg-white border border-zinc-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-check-circle text-emerald-600 text-lg"></i>
              <span className="text-sm font-semibold text-zinc-800">Eşleştirme Sonuçları</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-check text-green-600"></i>
                  <span className="text-xs text-zinc-700">Başarılı:</span>
                </div>
                <span className="text-sm font-bold text-green-700">
                  {matchResults.successful.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-exclamation-triangle text-amber-600"></i>
                  <span className="text-xs text-zinc-700">Belirsiz:</span>
                </div>
                <span className="text-sm font-bold text-amber-700">
                  {matchResults.ambiguous.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-times text-red-600"></i>
                  <span className="text-xs text-zinc-700">Hatalı:</span>
                </div>
                <span className="text-sm font-bold text-red-700">
                  {matchResults.failed.length}
                </span>
              </div>
            </div>

            {/* Detaylı Önizleme Button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full mt-3 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-table-list"></i>
              {showDetails ? 'Önizlemeyi Gizle' : 'Detaylı Önizleme'}
            </button>
          </div>

          {/* Detailed Table */}
          {showDetails && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-700">
                <i className="fa-solid fa-info-circle mr-1 text-blue-600"></i>
                Toplam {matchResults.successful.length + matchResults.ambiguous.length + matchResults.failed.length} satır
              </p>
              <MatchResultsTable
                matchResults={matchResults}
                dataColumn={columnMapping.dataColumn}
              />
            </div>
          )}
        </>
      )}

      {/* Ambiguous matches warning */}
      {!isMatching && hasMatched && matchResults.ambiguous.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <i className="fa-solid fa-exclamation-triangle mr-1"></i>
            <strong>{matchResults.ambiguous.length} belirsiz eşleşme</strong> bulundu. Örneğin
            "Merkez" ilçesi birden fazla ilde var. Bu satırlar görselleştirmede göz ardı
            edilecek.
          </p>
        </div>
      )}

      {/* Failed matches info */}
      {!isMatching && hasMatched && matchResults.failed.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-800">
            <i className="fa-solid fa-times-circle mr-1"></i>
            <strong>{matchResults.failed.length} hatalı eşleşme</strong> bulundu. Bu satırlarda
            konum veya veri değeri eksik/geçersiz.
          </p>
        </div>
      )}

      {/* Success message */}
      {!isMatching && hasMatched && matchResults.successful.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            <i className="fa-solid fa-check-circle mr-1"></i>
            {matchResults.successful.length} konum başarıyla eşleştirildi ve görselleştirmeye
            hazır!
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      {!isMatching && hasMatched && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i>
            Geri
          </button>
          <button
            onClick={handleNext}
            disabled={matchResults.successful.length === 0}
            className="flex-1 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İleri
            <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>
      )}
    </div>
  );
}
