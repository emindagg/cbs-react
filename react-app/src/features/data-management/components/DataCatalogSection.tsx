import { useDataManagementStore } from '../store/useDataManagementStore'

const CATALOG_IMPORT_RENDER_LIMIT = 200

export function DataCatalogSection() {
  const items = useDataManagementStore(state => state.items)
  const drawnItems = items.filter(item => item.source === 'drawn')
  const importedItems = items.filter(item => item.source === 'imported')

  const importedBySource = importedItems.reduce<Record<string, typeof importedItems>>((acc, item) => {
    const key = item.sourceLabel?.trim() || 'Bilinmeyen Kaynak'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sourceEntries = Object.entries(importedBySource)
  const hiddenSources = sourceEntries
    .filter(([, sourceItems]) => sourceItems.length > CATALOG_IMPORT_RENDER_LIMIT)
    .map(([sourceName, sourceItems]) => ({ sourceName, count: sourceItems.length }))

  const visibleImportedItems = sourceEntries
    .filter(([, sourceItems]) => sourceItems.length <= CATALOG_IMPORT_RENDER_LIMIT)
    .flatMap(([, sourceItems]) => sourceItems)

  const visibleItems = [...drawnItems, ...visibleImportedItems]
  const isTrulyEmpty = items.length === 0
  const showHiddenInfoOnly = !isTrulyEmpty && visibleItems.length === 0 && hiddenSources.length > 0

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-2 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
        <i className="fa-solid fa-database text-emerald-600 text-[10px]"></i>
        Veri Kataloğu
      </h3>

      {hiddenSources.length > 0 && (
        <div className="mb-2 px-2 py-1.5 rounded-md border border-amber-200 bg-amber-50 text-[10px] text-amber-800">
          Performans için {hiddenSources.length} dosya gizlendi. İçerik Yönetim panelinden yönetebilirsiniz.
          <div className="mt-1 text-[9px] text-amber-700">
            {hiddenSources.map(source => `${source.sourceName} (${source.count})`).join(', ')}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto text-sm custom-scrollbar">
        {isTrulyEmpty ? (
          <div className="flex items-center justify-center py-8 text-zinc-400 bg-zinc-50/50 rounded-lg border-2 border-dashed border-zinc-200">
            <div className="text-center">
              <i className="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
              <p className="text-sm font-medium text-zinc-500">Henüz veri eklenmedi</p>
              <p className="text-[10px] mt-1 text-zinc-400">Haritaya tıklayarak veri eklemeye başlayın</p>
            </div>
          </div>
        ) : showHiddenInfoOnly ? (
          <div className="flex items-center justify-center py-6 text-zinc-500 bg-zinc-50 rounded-lg border border-zinc-200">
            <div className="text-center">
              <p className="text-xs font-medium">İçe aktarılan veriler katalogda gizlendi</p>
              <p className="text-[10px] mt-1 text-zinc-400">İçerik Yönetim panelinden görünürlük kontrolü yapabilirsiniz</p>
            </div>
          </div>
        ) : (
          visibleItems.map(item => (
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

