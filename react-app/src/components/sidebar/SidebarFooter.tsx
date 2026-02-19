import versionInfo from '../../../version.json'

export default function SidebarFooter() {
  return (
    <div className="border-t border-zinc-200 bg-gradient-to-t from-zinc-50/80 to-white px-3 py-2.5 pb-4 shrink-0 z-10 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-globe text-emerald-600"></i>
          <span className="font-medium">CBS Platform</span>
          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">v{versionInfo.version} BETA</span>
        </div>
        <div className="flex items-center gap-2.5 text-zinc-400">
          <span className="flex items-center gap-0.5"><i className="fa-solid fa-chart-area text-emerald-500 text-[9px]"></i>Analiz</span>
          <span className="flex items-center gap-0.5"><i className="fa-solid fa-layer-group text-emerald-500 text-[9px]"></i>Katman</span>
        </div>
      </div>
      <div className="text-center text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-100">
        <i className="fa-solid fa-building-columns text-emerald-600 mr-1"></i>
        <span>Ortaöğretim Genel Müdürlüğü tarafından geliştirilmiştir.</span>
      </div>
      <div className="text-center text-[9px] text-zinc-400">
        <span>© {new Date().getFullYear()} Tüm hakları saklıdır.</span>
      </div>
    </div>
  )
}

