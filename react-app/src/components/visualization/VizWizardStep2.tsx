/**
 * Wizard Step 2: Column Mapping
 * Map columns to province, district, and data
 */

import { useState, useEffect } from 'react';
import { useVisualizationStore } from '../../stores/useVisualizationStore';

interface VizWizardStep2Props {
  onBack: () => void;
  onNext: () => void;
}

export default function VizWizardStep2({ onBack, onNext }: VizWizardStep2Props) {
  const { rawData, columns, columnMapping, setColumnMapping } = useVisualizationStore();

  const [selectedProvince, setSelectedProvince] = useState(columnMapping.locationColumn || '');
  const [selectedDistrict, setSelectedDistrict] = useState(columnMapping.districtColumn || '');
  const [selectedData, setSelectedData] = useState(columnMapping.dataColumn || '');
  const [locationLevel, setLocationLevel] = useState<'province' | 'district' | 'mixed'>(
    columnMapping.locationLevel
  );

  // Update store when selections change
  useEffect(() => {
    setColumnMapping({
      locationColumn: selectedProvince || null,
      districtColumn: selectedDistrict || null,
      dataColumn: selectedData || null,
      locationLevel,
    });
  }, [selectedProvince, selectedDistrict, selectedData, locationLevel, setColumnMapping]);

  // Get numeric columns
  const numericColumns = columns.filter((col) => {
    if (!rawData || rawData.length === 0) return false;
    const sample = rawData.slice(0, Math.min(10, rawData.length));
    const numericCount = sample.filter((row) => {
      const value = row[col];
      return typeof value === 'number' || !isNaN(Number(value));
    }).length;
    return numericCount / sample.length > 0.8;
  });

  const handleNext = () => {
    if (!selectedData) {
      alert('Lütfen veri sütunu seçin!');
      return;
    }

    if (locationLevel === 'province' && !selectedProvince) {
      alert('Lütfen il sütunu seçin!');
      return;
    }

    if (locationLevel === 'district' && !selectedDistrict) {
      alert('Lütfen ilçe sütunu seçin!');
      return;
    }

    if (locationLevel === 'mixed' && (!selectedProvince || !selectedDistrict)) {
      alert('Lütfen il ve ilçe sütunlarını seçin!');
      return;
    }

    onNext();
  };

  const showPreview = () => {
    if (!rawData || rawData.length === 0) return null;

    const preview = rawData.slice(0, 3);
    return preview.map((row, i) => {
      const cols = Object.entries(row).slice(0, 3);
      return (
        <div key={i} className="text-xs text-zinc-700 mb-1">
          <strong>Satır {i + 1}:</strong>{' '}
          {cols.map(([k, v]) => `${k}: ${v}`).join(', ')}...
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Location level selection */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 mb-2">Konum Seviyesi</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="location-level"
              value="province"
              checked={locationLevel === 'province'}
              onChange={(e) => setLocationLevel(e.target.value as 'province')}
              className="text-emerald-600"
            />
            <span className="text-xs text-zinc-700">Sadece İl</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="location-level"
              value="district"
              checked={locationLevel === 'district'}
              onChange={(e) => setLocationLevel(e.target.value as 'district')}
              className="text-emerald-600"
            />
            <span className="text-xs text-zinc-700">Sadece İlçe</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="location-level"
              value="mixed"
              checked={locationLevel === 'mixed'}
              onChange={(e) => setLocationLevel(e.target.value as 'mixed')}
              className="text-emerald-600"
            />
            <span className="text-xs text-zinc-700">Karışık (İl + İlçe)</span>
          </label>
        </div>
      </div>

      {/* Province column (if needed) */}
      {(locationLevel === 'province' || locationLevel === 'mixed') && (
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-2">İl Sütunu</label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">İl sütunu seçin...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* District column (if needed) */}
      {(locationLevel === 'district' || locationLevel === 'mixed') && (
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-2">İlçe Sütunu</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">İlçe sütunu seçin...</option>
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
        <label className="block text-xs font-medium text-zinc-700 mb-2">Veri Sütunu</label>
        <select
          value={selectedData}
          onChange={(e) => setSelectedData(e.target.value)}
          className="w-full text-xs border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Veri sütunu seçin...</option>
          {numericColumns.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">Sadece sayısal sütunlar gösteriliyor</p>
      </div>

      {/* Preview */}
      {rawData && rawData.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-zinc-700 mb-2">Veri Önizlemesi</p>
          {showPreview()}
        </div>
      )}

      {/* Navigation buttons */}
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
          className="flex-1 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
        >
          İleri
          <i className="fa-solid fa-arrow-right ml-1"></i>
        </button>
      </div>
    </div>
  );
}
