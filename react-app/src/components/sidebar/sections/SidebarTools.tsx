import { useToolStore } from '@/stores/useToolStore'
import type { ToolType } from '@/stores/useToolStore'

export default function SidebarTools() {
  const {
    activeTool,
    setActiveTool,
    resetDistance,
    showMeasurementTools,
    toggleMeasurementTools,
    showAdvancedAnalysis,
    toggleAdvancedAnalysis,
  } = useToolStore()

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
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#18181B] mb-2 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
        <i className="fa-solid fa-toolbox text-[#18181B] text-[10px]"></i>
        Aktif CBS Araç Kiti
      </h3>
      <div className="space-y-2">
        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={showMeasurementTools}
            onChange={toggleMeasurementTools}
            className="rounded-sm border-zinc-300 text-[#18181B] accent-[#18181B] focus:ring-[#18181B] mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <span className="text-sm text-[#18181B] font-normal">Ölçüm Araçları</span>
          </div>
        </label>

        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={showAdvancedAnalysis}
            onChange={toggleAdvancedAnalysis}
            className="rounded-sm border-zinc-300 text-[#18181B] accent-[#18181B] focus:ring-[#18181B] mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <span className="text-sm text-[#18181B] font-normal">Mekânsal Analiz</span>
          </div>
        </label>

        <label className="flex items-center px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-all bg-white hover:border-emerald-200">
          <input
            type="checkbox"
            checked={activeTool === 'timeline'}
            onChange={() => handleToolToggle('timeline')}
            className="rounded-sm border-zinc-300 text-[#18181B] accent-[#18181B] focus:ring-[#18181B] mr-2.5 h-4 w-4"
          />
          <div className="flex items-center">
            <span className="text-sm text-[#18181B] font-normal">Zaman Çizelgesi</span>
          </div>
        </label>
      </div>
    </section>
  )
}
