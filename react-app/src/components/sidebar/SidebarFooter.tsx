export default function SidebarFooter() {
    return (
        <div className="border-t border-zinc-200 bg-white px-3 py-2 pb-6 flex-shrink-0 z-10">
            <div className="flex items-center justify-between text-[10px] text-zinc-600 mb-2">
                <div className="flex items-center">
                    <i className="fa-solid fa-globe text-emerald-600 mr-1"></i>
                    <span>CBS Platform v3.5.0</span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="flex items-center"><i className="fa-solid fa-map-pin text-emerald-600 mr-1"></i>GIS</span>
                    <span className="flex items-center"><i className="fa-solid fa-chart-area text-emerald-600 mr-1"></i>Analiz</span>
                    <span className="flex items-center"><i className="fa-solid fa-layer-group text-emerald-600 mr-1"></i>Katman</span>
                </div>
            </div>
            <div className="text-center text-[10px] text-zinc-500 pt-1 pb-2 border-t border-zinc-100">
                <i className="fa-solid fa-building-columns text-emerald-600 mr-1"></i>
                <span>Ortaöğretim Genel Müdürlüğü tarafından geliştirilmiştir.</span>
            </div>
        </div>
    )
}
