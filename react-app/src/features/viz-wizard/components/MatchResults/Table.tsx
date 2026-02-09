/**
 * Match Results Table
 * Displays detailed matching results in a table format with inline editing
 */

import { useState } from 'react'

import type { MatchResults } from '@/types/visualization'

interface TableProps {
  matchResults: MatchResults;
  dataColumn: string | null;
  onEdit?: (rowIndex: number, newValue: string) => void;
}

export default function Table({ matchResults, dataColumn, onEdit }: TableProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const allResults = [
    ...matchResults.successful.map((r) => ({ ...r, status: 'success' as const })),
    ...matchResults.ambiguous.map((r) => ({ ...r, status: 'ambiguous' as const })),
    ...matchResults.failed.map((r) => ({ ...r, status: 'failed' as const })),
  ]

  // Sort by status (success -> ambiguous -> failed)
  allResults.sort((a, b) => {
    const order = { success: 0, ambiguous: 1, failed: 2 }
    return order[a.status] - order[b.status]
  })

  const getStatusIcon = (status: 'success' | 'ambiguous' | 'failed') => {
    switch (status) {
      case 'success':
        return <i className="fa-solid fa-check-circle text-green-600"></i>
      case 'ambiguous':
        return <i className="fa-solid fa-exclamation-triangle text-amber-600"></i>
      case 'failed':
        return <i className="fa-solid fa-times-circle text-red-600"></i>
    }
  }

  const getStatusText = (status: 'success' | 'ambiguous' | 'failed') => {
    switch (status) {
      case 'success':
        return 'Başarılı'
      case 'ambiguous':
        return 'Belirsiz'
      case 'failed':
        return 'Hatalı'
    }
  }

  const getStatusBgColor = (status: 'success' | 'ambiguous' | 'failed') => {
    switch (status) {
      case 'success':
        return 'bg-green-50'
      case 'ambiguous':
        return 'bg-amber-50'
      case 'failed':
        return 'bg-red-50'
    }
  }

  return (
    <div className="max-h-96 overflow-y-auto border border-zinc-200 rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-zinc-100 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
              Durum
            </th>
            <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
              Konum
            </th>
            <th className="px-3 py-2 text-center font-medium text-zinc-700 border-b border-zinc-200">
              Plaka
            </th>
            <th className="px-3 py-2 text-left font-medium text-zinc-700 border-b border-zinc-200">
              Eşleşen
            </th>
            {dataColumn && (
              <th className="px-3 py-2 text-right font-medium text-zinc-700 border-b border-zinc-200">
                {dataColumn}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {allResults.length === 0 ? (
            <tr>
              <td colSpan={dataColumn ? 5 : 4} className="px-3 py-4 text-center text-zinc-500">
                Eşleştirme sonucu yok
              </td>
            </tr>
          ) : (
            allResults.map((result, index) => (
              <tr
                key={index}
                className={`border-b border-zinc-100 hover:bg-zinc-50 ${getStatusBgColor(result.status)}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(result.status)}
                    <span className="text-xs font-medium">{getStatusText(result.status)}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  {result.status === 'failed' && editingRow === result.rowIndex ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onEdit?.(result.rowIndex, editValue)
                            setEditingRow(null)
                          }
                          if (e.key === 'Escape') {
                            setEditingRow(null)
                          }
                        }}
                        autoFocus
                        className="flex-1 px-2 py-1 text-[11px] border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          onEdit?.(result.rowIndex, editValue)
                          setEditingRow(null)
                        }}
                        className="px-2 py-1 text-[10px] text-green-600 hover:bg-green-50 rounded"
                        title="Kaydet"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button
                        onClick={() => setEditingRow(null)}
                        className="px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 rounded"
                        title="İptal"
                      >
                        <i className="fa-solid fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <span className="font-medium">{result.location || '-'}</span>
                      {result.status === 'failed' && onEdit && (
                        <button
                          onClick={() => {
                            setEditingRow(result.rowIndex)
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
                <td className="px-3 py-2 text-center">
                  {result.plateCode ? (
                    <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                      {result.plateCode}
                    </span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {result.status === 'success' ? (
                    <div className="text-zinc-700">
                      {result.province && result.district ? (
                        <>
                          {result.province} / {result.district}
                        </>
                      ) : result.province ? (
                        result.province
                      ) : result.district ? (
                        result.district
                      ) : (
                        '-'
                      )}
                    </div>
                  ) : result.status === 'ambiguous' ? (
                    <span className="text-amber-700 text-xs italic">Birden fazla eşleşme</span>
                  ) : (
                    <span className="text-red-700 text-xs italic">Eşleşme yok</span>
                  )}
                </td>
                {dataColumn && (
                  <td className="px-3 py-2 text-right font-mono">
                    {result.originalData[dataColumn] !== undefined
                      ? Number(result.originalData[dataColumn]).toLocaleString('tr-TR')
                      : '-'}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
