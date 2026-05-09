import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Clock,
  Info,
  Layers,
  MapPin,
  Navigation,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Popup } from 'react-map-gl/maplibre'

import type { DataItem } from '@/stores/useDataManagementStore'
import { getGeometryMeasurements } from '@/utils/geometryMeasurements'

import type { FeaturePopupState } from '../hooks/useFeaturePopup'

const TYPE_LABELS: Record<string, string> = {
  point: 'Nokta',
  line: 'Çizgi',
  polygon: 'Alan',
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function isDateString(val: unknown): boolean {
  if (typeof val !== 'string') return false
  return !isNaN(Date.parse(val)) && val.length > 10
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (isDateString(value)) {
    return new Date(value as string).toLocaleString('tr-TR')
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function PropIcon({ propKey }: { propKey: string }) {
  const k = propKey.toLowerCase()
  if (k.includes('id')) return <Info className="w-3 h-3" />
  if (k.includes('date') || k.includes('tarih')) return <Calendar className="w-3 h-3" />
  if (k.includes('lat') || k.includes('lon') || k.includes('lng')) return <Navigation className="w-3 h-3" />
  if (k.includes('depth') || k.includes('md') || k.includes('ele') || k.includes('yüksek')) return <Activity className="w-3 h-3" />
  return null
}

interface DetailViewProps {
  item: DataItem
  showBack: boolean
  onBack: () => void
  onClose: () => void
}

function DetailView({ item, showBack, onBack, onClose }: DetailViewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const userProps = Object.entries(item.properties).filter(([key]) => key !== 'style')
  const measurements = getGeometryMeasurements(item.geometry)
  const typeLabel = TYPE_LABELS[item.type] ?? item.type

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 p-1 bg-gray-50 rounded border border-gray-200">
                <Layers className="w-3.5 h-3.5 text-gray-500" />
              </span>
              <h3 className="text-gray-900 font-semibold text-sm tracking-tight leading-none truncate">
                {item.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {item.date && (
                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isDateString(item.date)
                    ? new Date(item.date).toLocaleString('tr-TR')
                    : item.date}
                </span>
              )}
              {item.date && <span className="h-1 w-1 bg-gray-200 rounded-full" />}
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {typeLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {showBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(v => !v)}
              className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      {isExpanded && (
        <div className="overflow-hidden max-h-60 overflow-y-auto">
          {userProps.length > 0 || measurements.area || measurements.length ? (
            <table className="w-full text-left border-collapse">
              <tbody>
                {measurements.area && (
                  <tr className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                    <th className="py-2.5 px-4 w-5/12 align-top font-normal">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-tight">
                        <Activity className="w-3 h-3" />
                        <span className="truncate" title="Alan">Alan</span>
                      </div>
                    </th>
                    <td className="py-2.5 px-4 text-[12px] font-medium text-gray-800 tabular-nums break-all">
                      {measurements.area}
                    </td>
                  </tr>
                )}
                {measurements.length && (
                  <tr className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                    <th className="py-2.5 px-4 w-5/12 align-top font-normal">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-tight">
                        <Navigation className="w-3 h-3" />
                        <span className="truncate" title="Uzunluk">Uzunluk</span>
                      </div>
                    </th>
                    <td className="py-2.5 px-4 text-[12px] font-medium text-gray-800 tabular-nums break-all">
                      {measurements.length}
                    </td>
                  </tr>
                )}
                {userProps.map(([key, value]) => (
                  <tr
                    key={key}
                    className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <th className="py-2.5 px-4 w-5/12 align-top font-normal">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-tight">
                        <PropIcon propKey={key} />
                        <span className="truncate" title={key}>{formatKey(key)}</span>
                      </div>
                    </th>
                    <td className="py-2.5 px-4 text-[12px] font-medium text-gray-800 tabular-nums break-all">
                      {formatValue(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-3 text-[11px] text-gray-400 italic">Özellik yok</p>
          )}
        </div>
      )}

    </div>
  )
}

interface ListViewProps {
  candidates: DataItem[]
  onSelect: (item: DataItem) => void
  onClose: () => void
}

function ListView({ candidates, onSelect, onClose }: ListViewProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-gray-50 rounded border border-gray-200">
                <Layers className="w-3.5 h-3.5 text-gray-500" />
              </span>
              <h3 className="text-gray-900 font-semibold text-sm tracking-tight leading-none">
                {candidates.length} öge bulundu
              </h3>
            </div>
            <p className="text-[10px] font-medium text-gray-400 pl-1">Görüntülemek için seçin</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-50 rounded-md transition-colors text-gray-400 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-52 overflow-y-auto">
        {candidates.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 transition-colors group ${i !== 0 ? 'border-t border-gray-50' : ''}`}
          >
            <span className="p-1 bg-gray-50 rounded border border-gray-200 shrink-0">
              <MapPin className="w-3 h-3 text-gray-500" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                {TYPE_LABELS[item.type] ?? item.type}
              </p>
            </div>
            <ChevronDown className="ml-auto shrink-0 w-3.5 h-3.5 text-gray-300 -rotate-90 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>

    </div>
  )
}

interface FeaturePopupProps {
  popup: FeaturePopupState
  onClose: () => void
  onSelect: (item: DataItem | null) => void
}

export function FeaturePopup({ popup, onClose, onSelect }: FeaturePopupProps) {
  const { lngLat, candidates, selected } = popup

  return (
    <Popup
      longitude={lngLat[0]}
      latitude={lngLat[1]}
      closeButton={false}
      closeOnClick={false}
      offset={14}
      maxWidth="320px"
      className="feature-info-popup"
    >
      <div className="w-72">
        {selected ? (
          <DetailView
            item={selected}
            showBack={candidates.length > 1}
            onBack={() => onSelect(null)}
            onClose={onClose}
          />
        ) : (
          <ListView candidates={candidates} onSelect={onSelect} onClose={onClose} />
        )}
      </div>
    </Popup>
  )
}
