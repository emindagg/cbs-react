/**
 * Wizard Step 3: Match Results
 * Show matching results and resolve ambiguities
 */

import { useState, useEffect } from 'react';
import { useVisualizationStore } from '../../stores/useVisualizationStore';
import { useMapStore } from '../../stores/useMapStore';
import { VisualizationManager } from '../../services/VisualizationManager';
import { ColumnMapper } from '../../utils/columnMapper';
import MatchResultsModal from './MatchResultsModal';

interface VizWizardStep3Props {
  onBack: () => void;
  onNext: () => void;
}

export default function VizWizardStep3({ onBack, onNext }: VizWizardStep3Props) {
  const [isMatching, setIsMatching] = useState(false);
  const [hasMatched, setHasMatched] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
    <div className="space-y-3">
      {/* Map not ready warning */}
      {!map && !isMatching && !hasMatched && (
        <div className="bg-amber-50/50 rounded-md p-2 flex items-center gap-2">
          <i className="fa-solid fa-clock text-amber-600 text-xs"></i>
          <p className="text-[11px] text-amber-700">Harita hazırlanıyor...</p>
        </div>
      )}

      {/* Manual trigger button if matching didn't start */}
      {!isMatching && !hasMatched && map && (
        <div>
          <button
            onClick={() => performMatching()}
            className="w-full px-3 py-2 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <i className="fa-solid fa-play mr-1.5 text-[10px]"></i>
            Eşleştirmeyi Başlat
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isMatching && (
        <div className="bg-blue-50/50 rounded-md p-2.5 flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-[11px] text-blue-700">Eşleştiriliyor...</p>
        </div>
      )}

      {/* Match results summary */}
      {!isMatching && hasMatched && (
        <>
          <div className="bg-white border border-zinc-100 rounded-md p-2.5 shadow-sm">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">
                  {matchResults.successful.length}
                </div>
                <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-check"></i>
                  Başarılı
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">
                  {matchResults.ambiguous.length}
                </div>
                <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  Belirsiz
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {matchResults.failed.length}
                </div>
                <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
                  <i className="fa-solid fa-xmark"></i>
                  Hatalı
                </div>
              </div>
            </div>

            {/* Detaylı Önizleme Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full px-3 py-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-table-list text-[9px]"></i>
              Detaylı Görüntüle
            </button>
          </div>
        </>
      )}

      {/* Match Results Modal */}
      <MatchResultsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        matchResults={matchResults}
        dataColumn={columnMapping.dataColumn}
      />

      {/* Warnings and info - compact */}
      {!isMatching && hasMatched && (
        <div className="space-y-1.5">
          {matchResults.ambiguous.length > 0 && (
            <div className="bg-amber-50/50 rounded p-1.5 flex items-start gap-1.5">
              <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[10px] mt-0.5"></i>
              <p className="text-[10px] text-amber-700 leading-relaxed">
                {matchResults.ambiguous.length} belirsiz eşleşme göz ardı edilecek
              </p>
            </div>
          )}

          {matchResults.failed.length > 0 && (
            <div className="bg-red-50/50 rounded p-1.5 flex items-start gap-1.5">
              <i className="fa-solid fa-circle-xmark text-red-600 text-[10px] mt-0.5"></i>
              <p className="text-[10px] text-red-700 leading-relaxed">
                {matchResults.failed.length} hatalı kayıt göz ardı edilecek
              </p>
            </div>
          )}

          {matchResults.successful.length > 0 && (
            <div className="bg-emerald-50/50 rounded p-1.5 flex items-start gap-1.5">
              <i className="fa-solid fa-circle-check text-emerald-600 text-[10px] mt-0.5"></i>
              <p className="text-[10px] text-emerald-700 leading-relaxed">
                {matchResults.successful.length} konum görselleştirmeye hazır
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {!isMatching && hasMatched && (
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={onBack}
            className="flex-1 px-3 py-1.5 text-[11px] font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
          >
            <i className="fa-solid fa-chevron-left mr-1 text-[9px]"></i>
            Geri
          </button>
          <button
            onClick={handleNext}
            disabled={matchResults.successful.length === 0}
            className="flex-1 px-3 py-1.5 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İleri
            <i className="fa-solid fa-chevron-right ml-1 text-[9px]"></i>
          </button>
        </div>
      )}
    </div>
  );
}
