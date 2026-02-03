import { create } from 'zustand'

// Mock Data Store (will be replaced by real data store)
interface DataItem {
    id: string
    name: string
    type: 'point' | 'area' | 'line'
}

interface DataStore {
    items: DataItem[]
}

const useDataStore = create<DataStore>(() => ({
    items: []
}))

export default function SidebarDataCatalog() {
    const items = useDataStore(state => state.items)

    return (
        <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">Veri Kataloğu</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto text-sm custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-zinc-400 bg-zinc-50/50 rounded-lg border-2 border-dashed border-zinc-200">
                        <div className="text-center">
                            <i className="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                            <p className="text-sm font-medium text-zinc-500">Henüz veri eklenmedi</p>
                            <p className="text-[10px] mt-1 text-zinc-400">Haritaya tıklayarak veri eklemeye başlayın</p>
                        </div>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id}>{item.name}</div>
                    ))
                )}
            </div>
        </section>
    )
}
