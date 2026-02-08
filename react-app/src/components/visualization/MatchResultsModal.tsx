/**
 * Match Results Modal
 * Full-screen modal showing detailed matching results with tabs and CSV export
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'

import { MatchResultsTabs } from './MatchResultsModal.tabs'
import { exportToCSV, getFilteredResults } from './MatchResultsModal.utils'
import type { MatchResults } from '../../types/visualization'
import { getProvinceByPlateCode } from '../../utils/turkishNormalizer'

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchResults: MatchResults;
  dataColumn: string | null;
  locationColumn?: string | null;
  onEdit?: (rowIndex: number, columnName: string, newValue: string) => void;
}

type TabType = 'all' | 'success' | 'ambiguous' | 'failed'

export default function MatchResultsModal({
  isOpen,
  onClose,
  matchResults,
  dataColumn,
  locationColumn,
  onEdit,
}: MatchResultsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: 'location' | 'data' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [plateEditingRow, setPlateEditingRow] = useState<number | null>(null)
  const [plateValue, setPlateValue] = useState('')

  const platePreview = plateValue ? getProvinceByPlateCode(plateValue) : null

  const handlePlateSubmit = (rowIndex: number) => {
    if (!platePreview || !locationColumn) return
    // Plaka kodunu konum sütununa yaz → re-match tetiklenecek
    onEdit?.(rowIndex, locationColumn, plateValue.padStart(2, '0'))
    setPlateEditingRow(null)
    setPlateValue('')
  }

  if (!isOpen) return null

  const filteredResults = getFilteredResults(matchResults, activeTab)

  const getStatusIcon = (status: 'success' | 'ambiguous' | 'failed') => {
    switch (status) {
      case 'success':
        return <i className="fa-solid fa-check text-green-600"></i>
      case 'ambiguous':
        return <i className="fa-solid fa-exclamation-triangle text-amber-600"></i>
      case 'failed':
        return <i className="fa-solid fa-times text-red-600"></i>
    }
  }

  const handleExportCSV = () => {
    exportToCSV(matchResults, dataColumn)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-linear-to-r from-zinc-50 to-white">
          <div>
            <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2">
              <i className="fa-solid fa-table-list text-emerald-600"></i>
              Eşleşme Önizlemesi
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Tüm satırların detaylı eşleşme durumu</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tabs */}
        <MatchResultsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          matchResults={matchResults}
        />

        {/* Table - Compact */}
        <div className="flex-1 overflow-auto px-5 py-3">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50 sticky top-0 z-10">
              <tr>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  #
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  Durum
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  Konum
                </th>
                <th className="px-2.5 py-2 text-center text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  Plaka
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  İl
                </th>
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  İlçe
                </th>
                {dataColumn && (
                  <th className="px-2.5 py-2 text-right text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                    Veri
                  </th>
                )}
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-zinc-600 border-b-2 border-zinc-200">
                  Mesaj
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={dataColumn ? 8 : 7} className="px-2.5 py-8 text-center text-zinc-400 text-xs">
                    <i className="fa-solid fa-inbox text-2xl mb-2 block text-zinc-300"></i>
                    Bu kategoride sonuç yok
                  </td>
                </tr>
              ) : (
                filteredResults.map((result, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-100 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-2.5 py-2 text-zinc-500">{index + 1}</td>
                    <td className="px-2.5 py-2">{getStatusIcon(result.status)}</td>
                    <td className="px-2.5 py-2 font-medium text-zinc-800">
                      {editingCell?.rowIndex === result.rowIndex && editingCell?.column === 'location' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && locationColumn) {
                                onEdit?.(result.rowIndex, locationColumn, editValue)
                                setEditingCell(null)
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null)
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-[11px] border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              if (locationColumn) {
                                onEdit?.(result.rowIndex, locationColumn, editValue)
                                setEditingCell(null)
                              }
                            }}
                            className="px-2 py-1 text-[10px] text-green-600 hover:bg-green-50 rounded"
                            title="Kaydet"
                          >
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            className="px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                            title="İptal"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span>{result.location || '-'}</span>
                          {onEdit && (
                            <button
                              onClick={() => {
                                setEditingCell({ rowIndex: result.rowIndex, column: 'location' })
                                setEditValue(result.location || '')
                              }}
                              className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-opacity"
                              title="Düzenle"
                            >
                              <i className="fa-solid fa-pen text-[9px]"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-center">
                      {plateEditingRow === result.rowIndex ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={81}
                              value={plateValue}
                              onChange={(e) => setPlateValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePlateSubmit(result.rowIndex)
                                if (e.key === 'Escape') { setPlateEditingRow(null); setPlateValue('') }
                              }}
                              autoFocus
                              placeholder="01-81"
                              className="w-14 px-1.5 py-1 text-[11px] text-center border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handlePlateSubmit(result.rowIndex)}
                              disabled={!platePreview}
                              className="px-1.5 py-1 text-[10px] text-green-600 hover:bg-green-50 rounded disabled:opacity-30"
                              title="Eşleştir"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button
                              onClick={() => { setPlateEditingRow(null); setPlateValue('') }}
                              className="px-1.5 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                              title="İptal"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                          {platePreview && (
                            <span className="text-[9px] text-emerald-600 font-medium">{platePreview}</span>
                          )}
                        </div>
                      ) : onEdit ? (
                        <button
                          onClick={() => { setPlateEditingRow(result.rowIndex); setPlateValue(result.plateCode || '') }}
                          className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors group ${
                            result.plateCode
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-400'
                              : 'text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300'
                          }`}
                          title="Plaka kodunu düzenle"
                        >
                          {result.plateCode || (
                            <>
                              <i className="fa-solid fa-hashtag text-[8px] mr-0.5"></i>
                              Plaka
                            </>
                          )}
                          {result.plateCode && (
                            <i className="fa-solid fa-pen text-[7px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          )}
                        </button>
                      ) : result.plateCode ? (
                        <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          {result.plateCode}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2 text-zinc-600">{result.province || '-'}</td>
                    <td className="px-2.5 py-2 text-zinc-600">{result.district || '-'}</td>
                    {dataColumn && (
                      <td className="px-2.5 py-2 text-right font-mono text-zinc-800">
                        {editingCell?.rowIndex === result.rowIndex && editingCell?.column === 'data' ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  onEdit?.(result.rowIndex, dataColumn, editValue)
                                  setEditingCell(null)
                                }
                                if (e.key === 'Escape') {
                                  setEditingCell(null)
                                }
                              }}
                              autoFocus
                              className="w-24 px-2 py-1 text-[11px] text-right border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => {
                                onEdit?.(result.rowIndex, dataColumn, editValue)
                                setEditingCell(null)
                              }}
                              className="px-2 py-1 text-[10px] text-green-600 hover:bg-green-50 rounded"
                              title="Kaydet"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                              title="İptal"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end group">
                            <span>
                              {result.originalData[dataColumn] !== undefined
                                ? Number(result.originalData[dataColumn]).toLocaleString('tr-TR')
                                : '-'}
                            </span>
                            {onEdit && result.originalData[dataColumn] !== undefined && (
                              <button
                                onClick={() => {
                                  setEditingCell({ rowIndex: result.rowIndex, column: 'data' })
                                  setEditValue(String(result.originalData[dataColumn]))
                                }}
                                className="opacity-0 group-hover:opacity-100 ml-2 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 rounded transition-opacity"
                                title="Düzenle"
                              >
                                <i className="fa-solid fa-pen text-[9px]"></i>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-2.5 py-2 text-[10px] text-zinc-500">
                      {result.status === 'success'
                        ? 'Başarılı eşleşme'
                        : result.status === 'ambiguous'
                          ? 'Birden fazla eşleşme'
                          : 'Eşleşme bulunamadı'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
          <p className="text-[10px] text-zinc-500">
            Toplam {filteredResults.length} kayıt gösteriliyor
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <i className="fa-solid fa-download text-[9px]"></i>
              CSV İndir
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
