/**
 * Wizard Step 2: DataMapper
 * Column mapping + AG Grid spreadsheet + real-time validation
 * Opens DataMapper in a centered modal for better horizontal space
 */

import { CheckCircle, AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import DataMapperModal from '@/components/modals/DataMapperModal'
import { useMatching } from '@/components/visualization/hooks/useMatching'
import { useMapStore } from '@/stores/useMapStore'
import { useVisualizationStore } from '@/stores/useVisualizationStore'
import { normalizeTurkishText } from '@/utils/turkishNormalizer'

interface VizWizardStep2Props {
  onBack: () => void
  onNext: () => void
}

export default function VizWizardStep2({ onBack, onNext }: VizWizardStep2Props) {
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

  const [isModalOpen, setIsModalOpen] = useState(true)

  const { isMatching, performMatching } = useMatching({
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

  // Trigger GeoJSON loading when map/columns/level change
  useEffect(() => {
    if (map && rawData && columnMapping.locationColumn) {
      performMatching().then((results) => {
        if (results) {
          setMatchResults(results)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, columnMapping.locationLevel, columnMapping.locationColumn])

  // Extract geoJsonKeys from loaded indexes
  const geoJsonKeys = useMemo((): string[] => {
    if (columnMapping.locationLevel === 'mixed') {
      if (!districtIndex) return []
      const keys = Object.keys(districtIndex as Record<string, unknown[]>)
      const compositeKeys = keys.filter((key) => key.includes('_'))

      // District index stores plate-code-based keys (e.g. "34_kadikoy").
      // DataMapper validation builds province-name-based keys (e.g. "istanbul_kadikoy").
      // Expand the set to include both formats.
      const allKeys = new Set(compositeKeys)
      for (const key of compositeKeys) {
        const idx = key.indexOf('_')
        const prefix = key.substring(0, idx)
        const suffix = key.substring(idx + 1)
        if (/^\d+$/.test(prefix)) {
          // Convert plate code to province name: "34" → "istanbul"
          const provinceName = normalizeTurkishText(prefix)
          allKeys.add(`${provinceName}_${suffix}`)
        }
      }
      return Array.from(allKeys)
    }

    // Province mode: province index keys, filter to alpha-only (exclude numeric plate codes)
    if (!provinceIndex) return []
    return Object.keys(provinceIndex as Record<string, unknown>).filter(
      (key) => /^[a-z]+$/.test(key),
    )
  }, [columnMapping.locationLevel, provinceIndex, districtIndex])

  // Match summary counts
  const successCount = matchResults.successful.length
  const failedCount = matchResults.failed.length
  const ambiguousCount = matchResults.ambiguous.length
  const totalCount = successCount + failedCount + ambiguousCount

  // Validate before proceeding
  const handleNext = () => {
    // Re-run matching with current data before advancing
    performMatching().then((results) => {
      if (results) {
        setMatchResults(results)
        if (results.successful.length === 0) {
          return // Don't proceed with zero matches
        }
        onNext()
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* Summary Card */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold text-zinc-700 flex items-center gap-1.5">
            <i className="fa-solid fa-table-columns text-blue-500 text-xs"></i>
            Veri Eşleştirme
          </h4>
          {totalCount > 0 && (
            <span className="text-[10px] text-zinc-500">{totalCount} kayıt</span>
          )}
        </div>

        {/* Column mapping summary */}
        {columnMapping.locationColumn && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="inline-block w-2 h-2 rounded-sm bg-blue-200" />
              <span className="text-zinc-500">İl:</span>
              <span className="font-medium text-zinc-700">{columnMapping.locationColumn}</span>
            </div>
            {columnMapping.locationLevel === 'mixed' && columnMapping.districtColumn && (
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="inline-block w-2 h-2 rounded-sm bg-emerald-200" />
                <span className="text-zinc-500">İlçe:</span>
                <span className="font-medium text-zinc-700">{columnMapping.districtColumn}</span>
              </div>
            )}
            {columnMapping.dataColumn && (
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="inline-block w-2 h-2 rounded-sm bg-orange-200" />
                <span className="text-zinc-500">Veri:</span>
                <span className="font-medium text-zinc-700">{columnMapping.dataColumn}</span>
              </div>
            )}
          </div>
        )}

        {/* Match results stats */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3 text-[10px] pt-1 border-t border-zinc-200">
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-emerald-500" />
              <span className="text-emerald-700 font-medium">{successCount} başarılı</span>
            </span>
            {ambiguousCount > 0 && (
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-exclamation-triangle text-amber-500 text-[10px]"></i>
                <span className="text-amber-700 font-medium">{ambiguousCount} belirsiz</span>
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle size={12} className="text-red-400" />
                <span className="text-red-600 font-medium">{failedCount} hatalı</span>
              </span>
            )}
          </div>
        )}

        {/* Open modal button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full px-3 py-2 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-1.5"
        >
          <i className="fa-solid fa-up-right-from-square text-[9px]"></i>
          {totalCount > 0 ? 'Tabloyu Düzenle' : 'Eşleştirme Tablosunu Aç'}
        </button>
      </div>

      {/* DataMapper Modal */}
      <DataMapperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        geoJsonKeys={geoJsonKeys}
        isLoading={isMatching}
      />

      {/* Navigation buttons */}
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
          disabled={isMatching}
          className="flex-1 px-3 py-1.5 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
        >
          {isMatching ? (
            <>
              <div className="inline-block animate-spin rounded-full h-2.5 w-2.5 border-2 border-white border-t-transparent mr-1" />
              Yukleniyor...
            </>
          ) : (
            <>
              İleri
              <i className="fa-solid fa-chevron-right ml-1 text-[9px]"></i>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
