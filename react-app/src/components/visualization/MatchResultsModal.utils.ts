/**
 * Match Results Modal Utilities
 * CSV export and filtering logic
 */

import type { MatchResults } from '../../types/visualization'

type TabType = 'all' | 'success' | 'ambiguous' | 'failed'

export function getFilteredResults(matchResults: MatchResults, activeTab: TabType) {
  const allResults = [
    ...matchResults.successful.map((r) => ({ ...r, status: 'success' as const })),
    ...matchResults.ambiguous.map((r) => ({ ...r, status: 'ambiguous' as const })),
    ...matchResults.failed.map((r) => ({ ...r, status: 'failed' as const })),
  ]

  // Sort alphabetically by location
  allResults.sort((a, b) => {
    const locationA = (a.location || '').toLowerCase()
    const locationB = (b.location || '').toLowerCase()
    return locationA.localeCompare(locationB, 'tr-TR')
  })

  switch (activeTab) {
    case 'success':
      return allResults.filter((r) => r.status === 'success')
    case 'ambiguous':
      return allResults.filter((r) => r.status === 'ambiguous')
    case 'failed':
      return allResults.filter((r) => r.status === 'failed')
    default:
      return allResults
  }
}

export function exportToCSV(matchResults: MatchResults, dataColumn: string | null) {
  const allResults = [
    ...matchResults.successful.map((r) => ({ ...r, status: 'Başarılı' })),
    ...matchResults.ambiguous.map((r) => ({ ...r, status: 'Belirsiz' })),
    ...matchResults.failed.map((r) => ({ ...r, status: 'Hatalı' })),
  ]

  // CSV Headers
  const headers = ['Sıra', 'Durum', 'Konum', 'Plaka', 'İl', 'İlçe', dataColumn || 'Veri', 'Mesaj']
  const csvContent = [
    headers.join(','),
    ...allResults.map((r, index) => {
      const row = [
        index + 1,
        r.status,
        r.location || '',
        r.plateCode || '',
        r.province || '',
        r.district || '',
        dataColumn ? r.originalData[dataColumn] || '' : '',
        r.status === 'Belirsiz' ? 'Birden fazla eşleşme' : r.status === 'Hatalı' ? 'Eşleşme yok' : 'Başarılı',
      ]
      return row.map((cell) => `"${cell}"`).join(',')
    }),
  ].join('\n')

  // Download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `esleme-onizlemesi-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
