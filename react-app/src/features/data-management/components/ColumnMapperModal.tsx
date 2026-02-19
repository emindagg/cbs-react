import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { ColumnMapping } from '../types'

interface ColumnMapperModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (mapping: ColumnMapping) => void
  headers: string[]
  previewData: Record<string, unknown>[]
  initialMapping?: ColumnMapping
}

export default function ColumnMapperModal({
  isOpen,
  onClose,
  onConfirm,
  headers,
  previewData,
  initialMapping,
}: ColumnMapperModalProps) {
  const [mapping, setMapping] = useState({
    lat: initialMapping?.lat || '',
    lon: initialMapping?.lon || '',
    name: initialMapping?.name || '',
    type: initialMapping?.type || '',
  })

  const isValid = useMemo(() => (
    mapping.lat !== '' && mapping.lon !== '' && mapping.lat !== mapping.lon
  ), [mapping])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-zinc-900 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-map-location-dot text-emerald-400 text-lg"></i>
            <h2 className="text-base font-semibold">Koordinat E\u015fle\u015ftirme</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="p-5 overflow-y-auto min-h-0">
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5">
            <i className="fa-solid fa-circle-check text-emerald-600 mt-0.5 text-sm"></i>
            <div>
              <h4 className="text-xs font-semibold text-emerald-800">Dosya Okundu</h4>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                Enlem ve boylam s\u00fctunlar\u0131n\u0131 se\u00e7erek e\u015fle\u015ftirin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Enlem (Latitude) <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.lat}
                onChange={(e) => setMapping({ ...mapping, lat: e.target.value })}
                className="w-full px-2.5 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden text-sm"
              >
                <option value="">Se\u00e7in...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Boylam (Longitude) <span className="text-red-500">*</span>
              </label>
              <select
                value={mapping.lon}
                onChange={(e) => setMapping({ ...mapping, lon: e.target.value })}
                className="w-full px-2.5 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden text-sm"
              >
                <option value="">Se\u00e7in...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                \u0130sim (Opsiyonel)
              </label>
              <select
                value={mapping.name}
                onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                className="w-full px-2.5 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden text-sm"
              >
                <option value="">Otomatik (S\u0131ra No)</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                T\u00fcr (Opsiyonel)
              </label>
              <select
                value={mapping.type}
                onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                className="w-full px-2.5 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden text-sm"
              >
                <option value="">Varsay\u0131lan (Point)</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Veri \u00d6nizleme (\u0130lk 5 Sat\u0131r)</h4>
            </div>
            <div className="border border-zinc-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-700 font-medium border-b border-zinc-200">
                  <tr>
                    {headers.map(header => (
                      <th key={header} className="px-3 py-2 whitespace-nowrap">
                        {header}
                        {header === mapping.lat && <span className="ml-1 text-[10px] text-emerald-600 bg-emerald-100 px-1 rounded-sm">Enlem</span>}
                        {header === mapping.lon && <span className="ml-1 text-[10px] text-blue-600 bg-blue-100 px-1 rounded-sm">Boylam</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-zinc-50">
                      {headers.map(header => (
                        <td key={header} className="px-3 py-2 whitespace-nowrap text-zinc-600">
                          {String(row[header] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium transition-colors"
          >
            \u0130ptal
          </button>
          <button
            onClick={() => onConfirm(mapping)}
            disabled={!isValid}
            className={`
              px-4 py-1.5 text-xs text-white rounded-lg font-medium shadow-xs transition-all flex items-center
              ${isValid ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 active:scale-95' : 'bg-zinc-300 cursor-not-allowed'}
            `}
          >
            <i className="fa-solid fa-check mr-1.5"></i>
            Onayla
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

