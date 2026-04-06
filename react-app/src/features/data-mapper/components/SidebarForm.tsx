/**
 * Vertical sidebar form for DataMapper default variant (column selects)
 */

import { COL_ACCENTS } from '../types'

interface SidebarFormProps {
  locationLevel: 'province' | 'mixed'
  setLocationLevel: (v: 'province' | 'mixed') => void
  selectedProvince: string
  setSelectedProvince: (v: string) => void
  selectedDistrict: string
  setSelectedDistrict: (v: string) => void
  selectedData: string
  setSelectedData: (v: string) => void
  columns: string[]
  numericColumns: string[]
}

export function SidebarForm({
  locationLevel,
  setLocationLevel,
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  selectedData,
  setSelectedData,
  columns,
  numericColumns,
}: SidebarFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-medium text-zinc-600 mb-1.5">
          Konum Seviyesi <span className="text-red-500">*</span>
        </label>
        <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden w-full">
          <label
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors ${locationLevel === 'province' ? 'bg-slate-700 text-white' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
          >
            <input type="radio" name="dm-location-level" value="province" checked={locationLevel === 'province'} onChange={() => setLocationLevel('province')} className="sr-only" />
            <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-white' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium">Sadece İl</span>
          </label>
          <div className="w-px bg-zinc-200" />
          <label
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 cursor-pointer transition-colors ${locationLevel === 'mixed' ? 'bg-slate-700 text-white' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
          >
            <input type="radio" name="dm-location-level" value="mixed" checked={locationLevel === 'mixed'} onChange={() => setLocationLevel('mixed')} className="sr-only" />
            <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-white' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium">İl + İlçe</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_ACCENTS.location }} />
            İl Sütunu
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Seçin...</option>
            {columns.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {locationLevel === 'mixed' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
              <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_ACCENTS.district }} />
              İlçe Sütunu
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            >
              <option value="">Seçin...</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-zinc-600 mb-1">
            <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: COL_ACCENTS.data }} />
            Veri Sütunu
          </label>
          <select
            value={selectedData}
            onChange={(e) => setSelectedData(e.target.value)}
            className="w-full text-[11px] border border-zinc-200 rounded-md px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Seçin...</option>
            {numericColumns.length > 0 && numericColumns.length < columns.length ? (
              <>
                {numericColumns.map((col) => <option key={col} value={col}>{col}</option>)}
                <option disabled>──────</option>
                {columns.filter((c) => !numericColumns.includes(c)).map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </>
            ) : (
              columns.map((col) => <option key={col} value={col}>{col}</option>)
            )}
          </select>
          <p className="text-[10px] text-zinc-400 mt-0.5">Sayısal sütunlar öncelikli</p>
        </div>
      </div>
    </div>
  )
}
