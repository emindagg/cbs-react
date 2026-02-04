/**
 * Wizard Step 3: Match Results
 * Show matching results and resolve ambiguities
 */

import { useState, useEffect } from 'react'

import { MatchResultsSummary } from './components/MatchResultsSummary'
import { MatchResultsWarnings } from './components/MatchResultsWarnings'
import { useMatching } from './hooks/useMatching'
import MatchResultsModal from './MatchResultsModal'
import { useMapStore } from '../../stores/useMapStore'
import { useVisualizationStore } from '../../stores/useVisualizationStore'

interface VizWizardStep3Props {
  onBack: () => void;
  onNext: () => void;
}

export default function VizWizardStep3({ onBack, onNext }: VizWizardStep3Props) {
  const [showModal, setShowModal] = useState(false)

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
  } = useVisualizationStore()

  const { mapInstance: map } = useMapStore()

  const { isMatching, hasMatched, performMatching } = useMatching({
    rawData,
    columnMapping,
    map,
    provincesGeoJSON,
    districtsGeoJSON,
    provinceIndex,
    districtIndex,
    setProvincesGeoJSON,
    setDistrictsGeoJSON,
    setProvinceIndex,
    setDistrictIndex,
  })

  useEffect(() => {
    if (!hasMatched) {
      performMatching().then(results => {
        if (results) {
          setMatchResults(results)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNext = () => {
    if (matchResults.ambiguous.length > 0) {
      // eslint-disable-next-line no-alert
      const proceed = confirm(
        `${matchResults.ambiguous.length} belirsiz eşleşme var. Bunlar görselleştirmede göz ardı edilecek. Devam edilsin mi?`,
      )
      if (!proceed) return
    }

    onNext()
  }

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
        <MatchResultsSummary
          matchResults={matchResults}
          onShowDetails={() => setShowModal(true)}
        />
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
        <MatchResultsWarnings matchResults={matchResults} />
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
  )
}
