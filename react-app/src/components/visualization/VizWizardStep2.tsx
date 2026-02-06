/**
 * Wizard Step 2: Column Mapping
 * Map columns to province, district, and data
 */

import { useState, useEffect } from 'react'

import { useVisualizationStore } from '../../stores/useVisualizationStore'

interface VizWizardStep2Props {
  onBack: () => void;
  onNext: () => void;
}

export default function VizWizardStep2({ onBack, onNext }: VizWizardStep2Props) {
  const { rawData, columns, columnMapping, setColumnMapping } = useVisualizationStore()

  const [selectedProvince, setSelectedProvince] = useState(columnMapping.locationColumn || '')
  const [selectedDistrict, setSelectedDistrict] = useState(columnMapping.districtColumn || '')
  const [selectedData, setSelectedData] = useState(columnMapping.dataColumn || '')
  const [locationLevel, setLocationLevel] = useState<'province' | 'mixed' | null>(
    (columnMapping.locationColumn || columnMapping.districtColumn) &&
    (columnMapping.locationLevel === 'province' || columnMapping.locationLevel === 'mixed')
      ? columnMapping.locationLevel
      : null,
  )

  // Update store when selections change
  useEffect(() => {
    setColumnMapping({
      locationColumn: selectedProvince || null,
      districtColumn: selectedDistrict || null,
      dataColumn: selectedData || null,
      locationLevel: locationLevel || 'province',
    })
  }, [selectedProvince, selectedDistrict, selectedData, locationLevel, setColumnMapping])

  // Get numeric columns
  const numericColumns = columns.filter((col) => {
    if (!rawData || rawData.length === 0) return false
    const sample = rawData.slice(0, Math.min(10, rawData.length))
    const numericCount = sample.filter((row) => {
      const value = row[col]
      return typeof value === 'number' || !isNaN(Number(value))
    }).length
    return numericCount / sample.length > 0.8
  })

  // Check if all required fields are selected
  const isFormValid = () => {
    // Location level must be selected
    if (!locationLevel) return false

    if (!selectedData) return false

    if (locationLevel === 'province' && !selectedProvince) return false

    if (locationLevel === 'mixed' && (!selectedProvince || !selectedDistrict)) return false

    return true
  }

  const handleNext = () => {
    if (!isFormValid()) {
      return
    }
    onNext()
  }

  const showPreview = () => {
    if (!rawData || rawData.length === 0) return null

    const preview = rawData.slice(0, 3)
    return preview.map((row, i) => {
      const cols = Object.entries(row).slice(0, 3)
      return (
        <div key={i} className="text-[10px] text-zinc-600">
          <span className="font-medium text-zinc-700">#{i + 1}</span>{' '}
          {cols.map(([k, v]) => `${k}: ${v}`).join(', ')}...
        </div>
      )
    })
  }

  return (
    <div className="space-y-3">
      {/* Location level selection */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
          Konum Seviyesi <span className="text-red-500">*</span>
        </label>
        <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden w-full">
          {/* Province only option */}
          <label className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors
            ${locationLevel === 'province'
      ? 'bg-slate-700 text-white'
      : 'bg-white text-zinc-700 hover:bg-zinc-50'
    }
          `}>
            <input
              type="radio"
              name="location-level"
              value="province"
              checked={locationLevel === 'province'}
              onChange={(e) => setLocationLevel(e.target.value as 'province')}
              className="sr-only"
            />
            <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-white' : 'text-zinc-400'}`}></i>
            <span className="text-[10px] font-medium">Sadece İl</span>
          </label>

          {/* Divider */}
          <div className="w-px bg-zinc-200"></div>

          {/* Mixed option */}
          <label className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors
            ${locationLevel === 'mixed'
      ? 'bg-slate-700 text-white'
      : 'bg-white text-zinc-700 hover:bg-zinc-50'
    }
          `}>
            <input
              type="radio"
              name="location-level"
              value="mixed"
              checked={locationLevel === 'mixed'}
              onChange={(e) => setLocationLevel(e.target.value as 'mixed')}
              className="sr-only"
            />
            <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-white' : 'text-zinc-400'}`}></i>
            <span className="text-[10px] font-medium">İl + İlçe</span>
          </label>
        </div>
        {!locationLevel && (
          <p className="text-[9px] text-red-500 mt-1">Lütfen konum seviyesi seçin</p>
        )}
      </div>

      {/* Province column (if needed) */}
      {(locationLevel === 'province' || locationLevel === 'mixed') && (
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">İl Sütunu</label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Seçin...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* District column (only for mixed mode) */}
      {locationLevel === 'mixed' && (
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">İlçe Sütunu</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Seçin...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Data column */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">Veri Sütunu</label>
        <select
          value={selectedData}
          onChange={(e) => setSelectedData(e.target.value)}
          className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          <option value="">Seçin...</option>
          {numericColumns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-400 mt-1">Sadece sayısal sütunlar</p>
      </div>

      {/* Preview */}
      {rawData && rawData.length > 0 && (
        <div className="bg-zinc-50/50 rounded-md p-2">
          <p className="text-[10px] font-semibold text-zinc-600 mb-1.5">Veri Önizlemesi</p>
          <div className="space-y-0.5">
            {showPreview()}
          </div>
        </div>
      )}

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
          disabled={!isFormValid()}
          className="flex-1 px-3 py-1.5 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
        >
          İleri
          <i className="fa-solid fa-chevron-right ml-1 text-[9px]"></i>
        </button>
      </div>
    </div>
  )
}
