import { SingleSlider } from '@/components/ui'
import type { VisualizationSettings } from '@/types/visualization'

interface ChoroplethSettingsProps {
  vizSettings: VisualizationSettings
  setVizSettings: (s: Partial<VisualizationSettings>) => void
}

export function ChoroplethSettings({ vizSettings, setVizSettings }: ChoroplethSettingsProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-3">
      <div className="text-[11px] font-semibold text-zinc-700">Koroplet Ayarları</div>

      <SingleSlider
        label="Şeffaflık"
        min={0}
        max={1}
        step={0.05}
        value={vizSettings.choroplethOpacity ?? 1}
        formatValue={(v) => `%${Math.round(v * 100)}`}
        onChange={(v) => setVizSettings({ choroplethOpacity: v })}
      />
    </div>
  )
}
