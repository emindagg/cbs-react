/**
 * Compact horizontal toolbar for DataMapper modal variant
 */

import { CheckCircle, AlertCircle } from 'lucide-react'

import { COL_COLORS } from './DataMapperConstants'

interface DataMapperModalToolbarProps {
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
  matchCount: number
  totalCount: number
}

export function DataMapperModalToolbar({
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
  matchCount,
  totalCount,
}: DataMapperModalToolbarProps) {
  return (
    <div className="shrink-0 bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Seviye</span>
        <div className="inline-flex rounded-lg border border-zinc-300 overflow-hidden shadow-sm">
          <label
            className={`flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer text-[11px] font-semibold transition-all ${locationLevel === 'province' ? 'bg-slate-700 text-white shadow-inner' : 'bg-white text-zinc-600 hover:bg-zinc-100'}`}
          >
            <input type="radio" name="dm-level-m" value="province" checked={locationLevel === 'province'} onChange={() => setLocationLevel('province')} className="sr-only" />
            <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-white' : 'text-zinc-400'}`} />
            İl
          </label>
          <div className="w-px bg-zinc-300" />
          <label
            className={`flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer text-[11px] font-semibold transition-all ${locationLevel === 'mixed' ? 'bg-slate-700 text-white shadow-inner' : 'bg-white text-zinc-600 hover:bg-zinc-100'}`}
          >
            <input type="radio" name="dm-level-m" value="mixed" checked={locationLevel === 'mixed'} onChange={() => setLocationLevel('mixed')} className="sr-only" />
            <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-white' : 'text-zinc-400'}`} />
            İl + İlçe
          </label>
        </div>
      </div>

      <div className="w-px h-5 bg-zinc-200" />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.location }} />
          <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">İl:</span>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
          >
            <option value="">Seçin...</option>
            {columns.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {locationLevel === 'mixed' && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.district }} />
            <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">İlçe:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
            >
              <option value="">Seçin...</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COL_COLORS.data }} />
          <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">Veri:</span>
          <select
            value={selectedData}
            onChange={(e) => setSelectedData(e.target.value)}
            className="text-[11px] border border-zinc-200 rounded px-2 py-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white min-w-[100px]"
          >
            <option value="">Seçin...</option>
            {numericColumns.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
      </div>

      <div className="w-px h-5 bg-zinc-200" />

      <div className="flex items-center gap-2.5 ml-auto">
        <div className="flex items-center gap-1">
          <CheckCircle size={13} className="text-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-700">{matchCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle size={13} className="text-red-400" />
          <span className="text-[11px] font-semibold text-red-600">{totalCount - matchCount}</span>
        </div>
        <span className="text-[10px] text-zinc-400">/ {totalCount}</span>
      </div>
    </div>
  )
}
