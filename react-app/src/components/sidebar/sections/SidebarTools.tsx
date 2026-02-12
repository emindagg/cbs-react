import { useToolStore } from '@/stores/useToolStore'
import type { ToolType } from '@/stores/useToolStore'

export default function SidebarTools() {
  const { activeTool, setActiveTool, resetDistance } = useToolStore()

  const handleToolToggle = (tool: ToolType) => {
    if (activeTool === tool) {
      // Deactivate if already active
      setActiveTool('none')
      // Special reset for distance
      if (tool === 'measure-distance') {
        resetDistance()
      }
    } else {
      setActiveTool(tool)
    }
  }

  return (
    <section className="hover:bg-zinc-50 rounded-lg px-2.5 py-1.5 transition-colors group">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-800 mb-2 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
        <i className="fa-solid fa-toolbox text-emerald-600 text-[10px]"></i>
        Aktif CBS Araç Kiti
      </h3>
      <div className="space-y-2">
        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={activeTool === 'measure-distance'}
            onChange={() => handleToolToggle('measure-distance')}
            className="rounded-sm border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <i className="fa-solid fa-ruler text-emerald-600 mr-2 text-sm w-4 text-center"></i>
            <span className="text-sm text-zinc-700 font-medium">Ölçüm Araçları (Mesafe)</span>
          </div>
        </label>

        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={activeTool === 'analysis'}
            onChange={() => handleToolToggle('analysis')}
            className="rounded-sm border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <i className="fa-solid fa-chart-line text-emerald-600 mr-2 text-sm w-4 text-center"></i>
            <span className="text-sm text-zinc-700 font-medium">Mekânsal Analiz</span>
          </div>
        </label>

        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={activeTool === 'timeline'}
            onChange={() => handleToolToggle('timeline')}
            className="rounded-sm border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500 mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <i className="fa-solid fa-clock text-emerald-600 mr-2 text-sm w-4 text-center"></i>
            <span className="text-sm text-zinc-700 font-medium">Zaman Çizelgesi</span>
          </div>
        </label>
      </div>
    </section>
  )
}
