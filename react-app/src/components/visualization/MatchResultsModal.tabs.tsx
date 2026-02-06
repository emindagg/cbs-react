/**
 * Match Results Modal Tabs Component
 */

import type { MatchResults } from '../../types/visualization'

type TabType = 'all' | 'success' | 'ambiguous' | 'failed'

interface MatchResultsTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  matchResults: MatchResults
}

export function MatchResultsTabs({ activeTab, onTabChange, matchResults }: MatchResultsTabsProps) {
  return (
    <div className="flex gap-1.5 px-5 py-2.5 border-b border-zinc-100 bg-zinc-50/50">
      <button
        onClick={() => onTabChange('all')}
        className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === 'all'
          ? 'bg-blue-600 text-white shadow-xs'
          : 'bg-white text-zinc-600 hover:bg-zinc-100'
        }`}
      >
        Tümü ({matchResults.successful.length + matchResults.ambiguous.length + matchResults.failed.length})
      </button>
      <button
        onClick={() => onTabChange('success')}
        className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === 'success'
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-white text-zinc-600 hover:bg-zinc-100'
        }`}
      >
        <i className="fa-solid fa-check mr-1 text-[9px]"></i>
        Başarılı ({matchResults.successful.length})
      </button>
      <button
        onClick={() => onTabChange('ambiguous')}
        className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === 'ambiguous'
          ? 'bg-amber-600 text-white shadow-xs'
          : 'bg-white text-zinc-600 hover:bg-zinc-100'
        }`}
      >
        <i className="fa-solid fa-triangle-exclamation mr-1 text-[9px]"></i>
        Belirsiz ({matchResults.ambiguous.length})
      </button>
      <button
        onClick={() => onTabChange('failed')}
        className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${activeTab === 'failed'
          ? 'bg-red-600 text-white shadow-xs'
          : 'bg-white text-zinc-600 hover:bg-zinc-100'
        }`}
      >
        <i className="fa-solid fa-circle-xmark mr-1 text-[9px]"></i>
        Hatalı ({matchResults.failed.length})
      </button>
    </div>
  )
}
