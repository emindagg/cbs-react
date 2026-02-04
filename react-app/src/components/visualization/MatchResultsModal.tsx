/**
 * Match Results Modal
 * Full-screen modal showing detailed matching results with tabs and CSV export
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'

import { MatchResultsTabs } from './MatchResultsModal.tabs'
import { exportToCSV, getFilteredResults } from './MatchResultsModal.utils'
import type { MatchResults } from '../../types/visualization'

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchResults: MatchResults;
  dataColumn: string | null;
}

type TabType = 'all' | 'success' | 'ambiguous' | 'failed'

export default function MatchResultsModal({
  isOpen,
  onClose,
  matchResults,
  dataColumn,
}: MatchResultsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

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
                  <td colSpan={dataColumn ? 7 : 6} className="px-2.5 py-8 text-center text-zinc-400 text-xs">
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
                    <td className="px-2.5 py-2 font-medium text-zinc-800">{result.location || '-'}</td>
                    <td className="px-2.5 py-2 text-zinc-600">{result.province || '-'}</td>
                    <td className="px-2.5 py-2 text-zinc-600">{result.district || '-'}</td>
                    {dataColumn && (
                      <td className="px-2.5 py-2 text-right font-mono text-zinc-800">
                        {result.originalData[dataColumn] !== undefined
                          ? Number(result.originalData[dataColumn]).toLocaleString('tr-TR')
                          : '-'}
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
