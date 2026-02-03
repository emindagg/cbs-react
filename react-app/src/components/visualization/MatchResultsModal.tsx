/**
 * Match Results Modal
 * Full-screen modal showing detailed matching results with tabs and CSV export
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { MatchResults } from '../../types/visualization';

interface MatchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchResults: MatchResults;
  dataColumn: string | null;
}

type TabType = 'all' | 'success' | 'ambiguous' | 'failed';

export default function MatchResultsModal({
  isOpen,
  onClose,
  matchResults,
  dataColumn,
}: MatchResultsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (!isOpen) return null;

  // Get filtered results based on active tab
  const getFilteredResults = () => {
    const allResults = [
      ...matchResults.successful.map((r) => ({ ...r, status: 'success' as const })),
      ...matchResults.ambiguous.map((r) => ({ ...r, status: 'ambiguous' as const })),
      ...matchResults.failed.map((r) => ({ ...r, status: 'failed' as const })),
    ];

    switch (activeTab) {
      case 'success':
        return allResults.filter((r) => r.status === 'success');
      case 'ambiguous':
        return allResults.filter((r) => r.status === 'ambiguous');
      case 'failed':
        return allResults.filter((r) => r.status === 'failed');
      default:
        return allResults;
    }
  };

  const filteredResults = getFilteredResults();

  const getStatusIcon = (status: 'success' | 'ambiguous' | 'failed') => {
    switch (status) {
      case 'success':
        return <i className="fa-solid fa-check text-green-600"></i>;
      case 'ambiguous':
        return <i className="fa-solid fa-exclamation-triangle text-amber-600"></i>;
      case 'failed':
        return <i className="fa-solid fa-times text-red-600"></i>;
    }
  };

  const exportToCSV = () => {
    const allResults = [
      ...matchResults.successful.map((r) => ({ ...r, status: 'Başarılı' })),
      ...matchResults.ambiguous.map((r) => ({ ...r, status: 'Belirsiz' })),
      ...matchResults.failed.map((r) => ({ ...r, status: 'Hatalı' })),
    ];

    // CSV Headers
    const headers = ['Sıra', 'Durum', 'Konum', 'İl', 'İlçe', dataColumn || 'Veri', 'Mesaj'];
    const csvContent = [
      headers.join(','),
      ...allResults.map((r, index) => {
        const row = [
          index + 1,
          r.status,
          r.location || '',
          r.province || '',
          r.district || '',
          dataColumn ? r.originalData[dataColumn] || '' : '',
          r.status === 'Belirsiz' ? 'Birden fazla eşleşme' : r.status === 'Hatalı' ? 'Eşleşme yok' : 'Başarılı',
        ];
        return row.map((cell) => `"${cell}"`).join(',');
      }),
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esleme-onizlemesi-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        // Close modal when clicking on overlay (not the modal content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <div>
            <h2 className="text-lg font-semibold text-zinc-800">Eşleşme Önizlemesi</h2>
            <p className="text-xs text-zinc-500 mt-1">Tüm satırların eşleşme durumu</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-zinc-200 bg-zinc-50">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            Tümü ({matchResults.successful.length + matchResults.ambiguous.length + matchResults.failed.length})
          </button>
          <button
            onClick={() => setActiveTab('success')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <i className="fa-solid fa-check mr-1"></i>
            Başarılı ({matchResults.successful.length})
          </button>
          <button
            onClick={() => setActiveTab('ambiguous')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'ambiguous'
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <i className="fa-solid fa-exclamation-triangle mr-1"></i>
            Belirsiz ({matchResults.ambiguous.length})
          </button>
          <button
            onClick={() => setActiveTab('failed')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'failed'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <i className="fa-solid fa-times mr-1"></i>
            Hatalı ({matchResults.failed.length})
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  #
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  Durum
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  Konum
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  İl
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  İlçe
                </th>
                {dataColumn && (
                  <th className="px-3 py-2 text-right font-medium text-zinc-700 border-b border-zinc-200">
                    Veri
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
                  Mesaj
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={dataColumn ? 7 : 6} className="px-3 py-8 text-center text-zinc-500">
                    Bu kategoride sonuç yok
                  </td>
                </tr>
              ) : (
                filteredResults.map((result, index) => (
                  <tr
                    key={index}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-3 py-2 text-zinc-600">{index + 1}</td>
                    <td className="px-3 py-2">{getStatusIcon(result.status)}</td>
                    <td className="px-3 py-2 font-medium">{result.location || '-'}</td>
                    <td className="px-3 py-2">{result.province || '-'}</td>
                    <td className="px-3 py-2">{result.district || '-'}</td>
                    {dataColumn && (
                      <td className="px-3 py-2 text-right font-mono">
                        {result.originalData[dataColumn] !== undefined
                          ? Number(result.originalData[dataColumn]).toLocaleString('tr-TR')
                          : '-'}
                      </td>
                    )}
                    <td className="px-3 py-2 text-xs text-zinc-600">
                      {result.status === 'success'
                        ? 'Başarılı'
                        : result.status === 'ambiguous'
                        ? 'Birden fazla eşleşme'
                        : 'Eşleşme yok'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Dışa Aktar (CSV)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
