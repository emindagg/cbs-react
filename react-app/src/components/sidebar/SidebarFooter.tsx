export default function SidebarFooter() {
  return (
    <div className="border-t border-zinc-200 bg-gradient-to-t from-zinc-50/80 to-white px-3 py-2.5 pb-4 shrink-0 z-10 space-y-2 relative">
      <div className="flex items-center justify-between gap-2 text-[9px] md:text-[10px] text-zinc-500 whitespace-nowrap">
        <div className="flex items-center gap-1 shrink-0">
          <i className="fa-solid fa-globe text-emerald-600"></i>
          <span className="font-medium">CBS Platform</span>
          <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">v1.1b</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 shrink-0">
          <span className="flex items-center gap-0.5"><i className="fa-solid fa-chart-area text-emerald-500 text-[9px]"></i>Analiz</span>
          <span className="flex items-center gap-0.5"><i className="fa-solid fa-layer-group text-emerald-500 text-[9px]"></i>Katman</span>
        </div>
      </div>
      <div className="text-center text-[8px] md:text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-100 px-0.5 leading-tight">
        <i className="fa-solid fa-building-columns text-emerald-600 mr-1"></i>
        <span>Ortaöğretim Genel Müdürlüğü tarafından geliştirilmiştir.</span>
      </div>
      <div className="text-center text-[9px] text-zinc-400 px-1 leading-tight">
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}

