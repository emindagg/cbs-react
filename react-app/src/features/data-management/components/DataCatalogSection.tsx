import { useDataManagementStore } from '../store/useDataManagementStore'

export function DataCatalogSection() {
  const items = useDataManagementStore(state => state.items)

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-2 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
        <i className="fa-solid fa-database text-emerald-600 text-[10px]"></i>
        Veri Katalogu
      </h3>
      <div className="space-y-2 max-h-40 overflow-y-auto text-sm custom-scrollbar">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-400 bg-zinc-50/50 rounded-lg border-2 border-dashed border-zinc-200">
            <div className="text-center">
              <i className="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
              <p className="text-sm font-medium text-zinc-500">Henuz veri eklenmedi</p>
              <p className="text-[10px] mt-1 text-zinc-400">Haritaya tiklayarak veri eklemeye baslayin</p>
            </div>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-100 bg-white hover:bg-zinc-50 transition-colors">
              <i className={`fa-solid text-[10px] ${item.type === 'point' ? 'fa-location-dot text-blue-500' : item.type === 'line' ? 'fa-route text-orange-500' : 'fa-draw-polygon text-emerald-500'}`}></i>
              <span className="text-xs text-zinc-700 font-medium truncate">{item.name}</span>
              {item.visible && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

