/**
 * Compact horizontal toolbar for DataMapper modal variant
 */

import { CheckCircle, AlertCircle } from 'lucide-react'

import { COL_ACCENTS } from '../types'

interface ModalToolbarProps {
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

export function ModalToolbar({
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
}: ModalToolbarProps) {
  const failCount = totalCount - matchCount
  const matchPct = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0

  return (
    <div className="shrink-0 bg-[#fafbfc] border-b border-zinc-200/80 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Level toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Seviye</span>
        <div className="inline-flex rounded-md border border-zinc-200 overflow-hidden">
          <label
            className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer text-[11px] font-semibold transition-all ${
              locationLevel === 'province'
                ? 'bg-[#1e2330] text-white'
                : 'bg-white text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            <input type="radio" name="dm-level-m" value="province" checked={locationLevel === 'province'} onChange={() => setLocationLevel('province')} className="sr-only" />
            <i className={`fa-solid fa-map-location-dot text-[9px] ${locationLevel === 'province' ? 'text-emerald-400' : 'text-zinc-400'}`} />
            İl
          </label>
          <label
            className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer text-[11px] font-semibold transition-all border-l border-zinc-200 ${
              locationLevel === 'mixed'
                ? 'bg-[#1e2330] text-white'
                : 'bg-white text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            <input type="radio" name="dm-level-m" value="mixed" checked={locationLevel === 'mixed'} onChange={() => setLocationLevel('mixed')} className="sr-only" />
            <i className={`fa-solid fa-layer-group text-[9px] ${locationLevel === 'mixed' ? 'text-emerald-400' : 'text-zinc-400'}`} />
            İl + İlçe
          </label>
        </div>
      </div>

      <div className="w-px h-4 bg-zinc-200" />

      {/* Column selectors */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: COL_ACCENTS.location }} />
          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">İl</span>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="text-[11px] border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 bg-white text-zinc-700 font-medium min-w-[90px]"
          >
            <option value="">Seçin...</option>
            {columns.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {locationLevel === 'mixed' && (
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: COL_ACCENTS.district }} />
            <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">İlçe</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-[11px] border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 bg-white text-zinc-700 font-medium min-w-[90px]"
            >
              <option value="">Seçin...</option>
              {columns.map((col) => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: COL_ACCENTS.data }} />
          <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Veri</span>
          <select
            value={selectedData}
            onChange={(e) => setSelectedData(e.target.value)}
            className="text-[11px] border border-zinc-200 rounded-md px-2 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 bg-white text-zinc-700 font-medium min-w-[90px]"
          >
            <option value="">Seçin...</option>
            {numericColumns.map((col) => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
      </div>

      <div className="w-px h-4 bg-zinc-200" />

      {/* Match stats — compact pill */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700 tabular-nums">{matchCount}</span>
        </div>
        {failCount > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle size={12} className="text-red-400" />
            <span className="text-[11px] font-bold text-red-500 tabular-nums">{failCount}</span>
          </div>
        )}
        <span className="text-[9px] text-zinc-400 font-medium tabular-nums">/ {totalCount}</span>
        {totalCount > 0 && (
          <div className="w-12 h-1 bg-zinc-200 rounded-full overflow-hidden ml-1">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${matchPct}%`,
                backgroundColor: matchPct === 100 ? '#10b981' : matchPct > 50 ? '#64748b' : '#ef4444',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
