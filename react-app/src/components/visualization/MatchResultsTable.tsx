/**
 * Match Results Table
 * Displays detailed matching results in a table format
 */

import type { MatchResults } from '../../types/visualization'

interface MatchResultsTableProps {
  matchResults: MatchResults;
  dataColumn: string | null;
}

export default function MatchResultsTable({ matchResults, dataColumn }: MatchResultsTableProps) {
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
              <td colSpan={dataColumn ? 4 : 3} className="px-3 py-4 text-center text-zinc-500">
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
                  <span className="font-medium">{result.location || '-'}</span>
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
